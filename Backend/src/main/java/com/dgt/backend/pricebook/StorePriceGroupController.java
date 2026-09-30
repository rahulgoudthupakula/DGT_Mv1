package com.dgt.backend.pricebook;
import java.util.*;
import java.math.BigDecimal;
import com.dgt.backend.access.*;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/price-groups")
public class StorePriceGroupController {
 private final ScopedAccess a;private final ApprovalService approvals;private final ObjectMapper json;
 public StorePriceGroupController(ScopedAccess a,ApprovalService approvals,ObjectMapper json){this.a=a;this.approvals=approvals;this.json=json;}
 public record Input(String name,String description,BigDecimal groupPrice,List<Long> products,UUID creationKey){}
 private ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 private ResponseStatusException conflict(String s){return new ResponseStatusException(HttpStatus.CONFLICT,s);}
 @GetMapping public Object list(@PathVariable String store){a.grant(a.user(),store,"PRICE_BOOK",false);
 var groups=a.db.queryForList("SELECT g.price_group_id AS id,g.xmin::text AS version,g.price_group_name AS name,COALESCE(g.description,'') AS description,g.group_price AS \"groupPrice\",g.is_active AS active,COALESCE((SELECT json_agg(json_build_object('id',p.product_id,'sku',p.product_sku,'name',p.product_name,'retail',"+ItemSellingPrice.SQL+",'regularRetail',pr.retail_price,'cost',CASE WHEN p.purchase_unit='CASE' THEN (p.purchase_gross_cost-COALESCE(p.purchase_discount,0))/NULLIF(p.units_per_case,0) ELSE p.purchase_gross_cost-COALESCE(p.purchase_discount,0) END) ORDER BY p.product_name,p.product_id) FROM product_price_groups l JOIN products p ON p.product_id=l.product_id AND p.dgt_id=l.dgt_id LEFT JOIN product_store_prices pr ON pr.product_id=p.product_id AND pr.dgt_id=p.dgt_id WHERE l.archived_at IS NULL AND l.price_group_id=g.price_group_id AND l.dgt_id=g.dgt_id AND (l.is_active OR NOT g.is_active)),'[]'::json) AS items FROM price_groups g WHERE g.dgt_id=? ORDER BY g.price_group_id",store);
 var items=a.db.queryForList("SELECT p.product_id AS id,p.product_name AS name,p.product_sku AS sku,pr.retail_price AS retail,CASE WHEN p.purchase_unit='CASE' THEN (p.purchase_gross_cost-COALESCE(p.purchase_discount,0))/NULLIF(p.units_per_case,0) ELSE p.purchase_gross_cost-COALESCE(p.purchase_discount,0) END AS cost,l.price_group_id AS \"groupId\" FROM products p LEFT JOIN product_store_prices pr ON pr.product_id=p.product_id AND pr.dgt_id=p.dgt_id LEFT JOIN product_price_groups l ON l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id AND l.is_active WHERE p.dgt_id=? AND p.is_active ORDER BY p.product_name,p.product_id",store);
 return Map.of("groups",groups.stream().map(Rows::normalize).toList(),"items",items.stream().map(Rows::normalize).toList());}
 @PostMapping @Transactional public Object create(@PathVariable String store,@RequestBody Input in,@RequestHeader("Idempotency-Key") String key){UUID uuid;try{uuid=UUID.fromString(key);}catch(Exception e){throw bad("Creation key must be a UUID");}return approvals.submit(store,"PRICE_GROUP_SAVE",null,null,new Input(in.name(),in.description(),in.groupPrice(),in.products(),uuid),key);}
 @PutMapping("/{id}") @Transactional public Object update(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestHeader("Idempotency-Key") String key,@RequestBody Input in){return approvals.submit(store,"PRICE_GROUP_SAVE",Long.toString(id),version,new Input(in.name(),in.description(),in.groupPrice(),in.products(),null),key);}
 @PostMapping("/{id}/deactivate") @Transactional public Object deactivate(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestHeader("Idempotency-Key") String key){return approvals.submit(store,"PRICE_GROUP_DEACTIVATE",Long.toString(id),version,Map.of(),key);}
 public Object apply(String store,String target,String version,Input in){
 a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
 if(in.name()==null||in.name().isBlank()||in.name().trim().length()>150||in.description()!=null&&in.description().length()>500)throw bad("Enter a group name up to 150 characters and description up to 500");
 if(in.groupPrice()==null||in.groupPrice().signum()<0||in.groupPrice().scale()>2||in.groupPrice().compareTo(new BigDecimal("99999999.99"))>0)throw bad("Enter a non-negative price with at most two decimals");
 if(in.products()==null||in.products().size()>500||in.products().contains(null)||new HashSet<>(in.products()).size()!=in.products().size())throw bad("Choose up to 500 distinct store items");
 Long id=target==null?null:Long.valueOf(target);String payload=json.writeValueAsString(in);
 if(id==null){var prior=a.db.queryForList("SELECT price_group_id,creation_payload FROM price_groups WHERE dgt_id=? AND creation_key=?",store,in.creationKey());if(!prior.isEmpty()){if(!json.readTree(prior.getFirst().get("creation_payload").toString()).equals(json.readTree(payload)))throw conflict("Creation key already used with different details");return Map.of("id",prior.getFirst().get("price_group_id"),"saved",true);}}
 if(!a.db.queryForList("SELECT price_group_id FROM price_groups WHERE dgt_id=? AND price_group_name=? AND (?::bigint IS NULL OR price_group_id<>?)",store,in.name().trim(),id,id).isEmpty())throw bad("A group with this name already exists in this store");
 for(Long product:in.products()){
 if(a.db.queryForList("SELECT product_id FROM products WHERE product_id=? AND dgt_id=? AND is_active FOR UPDATE",product,store).size()!=1)throw bad("Choose active items from this store");
 if(!a.db.queryForList("SELECT price_group_id FROM product_price_groups WHERE product_price_groups.archived_at IS NULL AND dgt_id=? AND product_id=? AND is_active AND (?::bigint IS NULL OR price_group_id<>?)",store,product,id,id).isEmpty())throw conflict("An item already belongs to another active price group; unlink it first");
 }
 if(id==null)id=a.db.queryForObject("INSERT INTO price_groups(dgt_id,price_group_name,description,group_price,creation_key,creation_payload) VALUES (?,?,?,?,?,CAST(? AS jsonb)) RETURNING price_group_id",Long.class,store,in.name().trim(),in.description(),in.groupPrice(),in.creationKey(),payload);
 else {if(a.db.update("UPDATE price_groups SET price_group_name=?,description=?,group_price=?,updated_at=CURRENT_TIMESTAMP WHERE price_group_id=? AND dgt_id=? AND xmin::text=? AND is_active",in.name().trim(),in.description(),in.groupPrice(),id,store,version)!=1)throw conflict("Group changed or is inactive; reload and retry");for(Long removed:a.db.queryForList("SELECT product_id FROM product_price_groups WHERE product_price_groups.archived_at IS NULL AND price_group_id=? AND dgt_id=? AND is_active",Long.class,id,store))if(!in.products().contains(removed))touchProduct(store,removed);
 a.db.update("UPDATE product_price_groups SET is_active=false,archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND price_group_id=? AND dgt_id=?",id,store);}
 for(Long product:in.products()){
 a.db.update("INSERT INTO product_price_groups(price_group_id,product_id,dgt_id) VALUES (?,?,?) ON CONFLICT(price_group_id,product_id) DO UPDATE SET is_active=true,archived_at=NULL,updated_at=CURRENT_TIMESTAMP",id,product,store);
 var old=a.db.queryForList("SELECT retail_price FROM product_store_prices WHERE dgt_id=? AND product_id=?",store,product);

 a.db.update("UPDATE products SET updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND dgt_id=?",product,store);
 a.audit(store,"PRICE_GROUP_EFFECTIVE_PRICE",product.toString(),json.writeValueAsString(Map.of("groupId",id,"regularPriceRecords",old,"groupPrice",in.groupPrice())));
 }
 a.audit(store,target==null?"PRICE_GROUP_CREATED":"PRICE_GROUP_UPDATED",id.toString(),payload);return Map.of("saved",true,"id",id);
 }
 private void touchProduct(String store,long product){a.db.update("UPDATE products SET updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND product_id=?",store,product);}

 public Object applyDeactivate(String store,String target,String version){a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);long id=Long.parseLong(target);if(a.db.update("UPDATE price_groups SET is_active=false,updated_at=CURRENT_TIMESTAMP WHERE price_group_id=? AND dgt_id=? AND xmin::text=? AND is_active",id,store,version)!=1)throw conflict("Group changed or is inactive; reload and retry");for(Long product:a.db.queryForList("SELECT product_id FROM product_price_groups WHERE product_price_groups.archived_at IS NULL AND price_group_id=? AND dgt_id=? AND is_active",Long.class,id,store))touchProduct(store,product);a.db.update("UPDATE product_price_groups SET is_active=false,updated_at=CURRENT_TIMESTAMP WHERE price_group_id=? AND dgt_id=?",id,store);a.audit(store,"PRICE_GROUP_DEACTIVATED",target,"{}");return Map.of("deactivated",true);}
}
