package com.dgt.backend.pricebook;

import java.util.*;
import java.math.BigDecimal;
import java.time.*;
import com.dgt.backend.access.*;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/promotions")
public class StorePromotionController {
 private final ScopedAccess a;private final ApprovalService approvals;private final ObjectMapper json;
 public StorePromotionController(ScopedAccess a,ApprovalService approvals,ObjectMapper json){this.a=a;this.approvals=approvals;this.json=json;}
 public record Part(long productId,BigDecimal quantity){}
 public record Input(String name,String type,List<Part> products,BigDecimal discountValue,BigDecimal buyQty,BigDecimal freeQty,LocalDate start,LocalDate end,UUID creationKey){}
 private ResponseStatusException bad(String text){return new ResponseStatusException(HttpStatus.BAD_REQUEST,text);}
 private ResponseStatusException conflict(){return new ResponseStatusException(HttpStatus.CONFLICT,"Promotion changed or is unavailable; reload and retry");}
 private boolean wholeQuantity(BigDecimal n){return n!=null&&n.signum()>0&&n.stripTrailingZeros().scale()<=0&&n.compareTo(BigDecimal.valueOf(1000000))<=0;}
 private ZoneId zone(String store){String name=a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store);try{return ZoneId.of(name);}catch(Exception e){throw bad("Set a valid store timezone before managing promotions");}}
 @GetMapping public Object list(@PathVariable String store){a.grant(a.user(),store,"PRICE_BOOK",false);String zone=zone(store).getId();
  var promos=a.db.queryForList("SELECT p.promotion_id AS id,p.xmin::text AS version,p.promotion_name AS name,p.promotion_type AS type,p.discount_value AS \"discountValue\",p.buy_quantity AS \"buyQty\",p.free_quantity AS \"freeQty\",(p.start_date AT TIME ZONE ?)::date AS start,(p.end_date AT TIME ZONE ?)::date AS end,p.is_active AS active,CASE WHEN NOT p.is_active THEN 'Inactive' WHEN CURRENT_TIMESTAMP<p.start_date THEN 'Upcoming' WHEN CURRENT_TIMESTAMP>p.end_date THEN 'Expired' ELSE 'Active' END AS status,(p.end_date>=CURRENT_TIMESTAMP-INTERVAL '30 days') AS \"expiredWithin30Days\",COALESCE((SELECT json_agg(json_build_object('productId',pr.product_id,'name',pr.product_name,'sku',pr.product_sku,'quantity',pp.required_quantity) ORDER BY pr.product_name,pr.product_id) FROM promotion_products pp JOIN products pr ON pr.product_id=pp.product_id AND pr.dgt_id=pp.dgt_id WHERE pp.archived_at IS NULL AND pp.promotion_id=p.promotion_id AND pp.dgt_id=p.dgt_id),'[]'::json) AS products FROM promotions p WHERE p.dgt_id=? ORDER BY p.created_at DESC,p.promotion_id DESC",zone,zone,store);
  var items=a.db.queryForList("SELECT product_id AS id,product_name AS name,product_sku AS sku,is_active AS active FROM products WHERE dgt_id=? ORDER BY product_name,product_id",store);
  return Map.of("discountTypes",DiscountTypes.promotions(a.db),"promotions",promos.stream().map(Rows::normalize).toList(),"items",items.stream().map(Rows::normalize).toList(),"timezone",zone);
 }
 @PostMapping @Transactional public Object create(@PathVariable String store,@RequestBody Input in,@RequestHeader("Idempotency-Key") String key){
  UUID uuid;try{uuid=UUID.fromString(key);}catch(Exception e){throw bad("Idempotency-Key must be a UUID");}
  return approvals.submit(store,"PROMOTION_SAVE",null,null,new Input(in.name(),in.type(),in.products(),in.discountValue(),in.buyQty(),in.freeQty(),in.start(),in.end(),uuid),key);
 }
 @PutMapping("/{id}") @Transactional public Object update(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestHeader("Idempotency-Key") String key,@RequestBody Input in){return approvals.submit(store,"PROMOTION_SAVE",Long.toString(id),version,new Input(in.name(),in.type(),in.products(),in.discountValue(),in.buyQty(),in.freeQty(),in.start(),in.end(),null),key);}
 @PostMapping("/{id}/deactivate") @Transactional public Object deactivate(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestHeader("Idempotency-Key") String key){return approvals.submit(store,"PROMOTION_DEACTIVATE",Long.toString(id),version,Map.of(),key);}
 public Object apply(String store,String target,String version,Input in){
  a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  if(in.name()==null||in.name().isBlank()||in.name().trim().length()>150)throw bad("Enter a promotion name of at most 150 characters");
  if(in.type()==null||!DiscountTypes.promotionAllowed(a.db,in.type()))throw bad("Choose a supported promotion type");
  if(in.start()==null||in.end()==null||in.end().isBefore(in.start())||in.end().getYear()>9998||in.start().getYear()<1)throw bad("Choose valid start and end dates; end cannot precede start");
  if(in.products()==null||in.products().isEmpty()||in.products().size()>500)throw bad("Choose between 1 and 500 products from this store");
  var ids=new HashSet<Long>();
  for(var p:in.products()){
   if(p==null||!ids.add(p.productId()))throw bad("Select each product only once");
   if(!wholeQuantity(p.quantity()))throw bad("Product quantities must be positive whole numbers up to 1000000");
   if(!"Bundle".equals(in.type())&&p.quantity().compareTo(BigDecimal.ONE)!=0)throw bad("Per-product quantities apply only to bundles");
   if(a.db.queryForList("SELECT product_id FROM products WHERE product_id=? AND dgt_id=? AND is_active FOR SHARE",p.productId(),store).size()!=1)throw bad("Choose active products belonging to this store");
  }
  if("Buy X Get Y".equals(in.type())){
   if(!wholeQuantity(in.buyQty())||!wholeQuantity(in.freeQty()))throw bad("Buy and free quantities must be positive whole numbers up to 1000000");
   if(in.discountValue()!=null)throw bad("Buy X Get Y uses quantities, not a discount amount");
  }else{
   if(in.buyQty()!=null||in.freeQty()!=null)throw bad("Buy/free quantities apply only to Buy X Get Y");
   BigDecimal n=in.discountValue();if(n==null||n.signum()<0||n.scale()>2||n.compareTo(new BigDecimal("9999999999.99"))>0)throw bad("Enter a non-negative value with at most two decimals");
   if("% Discount".equals(in.type())?n.compareTo(BigDecimal.valueOf(100))>0:n.signum()==0)throw bad("Percentage must be at most 100; price must be greater than zero");
  }
  ZoneId zone=zone(store);var start=in.start().atStartOfDay(zone).toOffsetDateTime();var end=in.end().plusDays(1).atStartOfDay(zone).minusNanos(1000).toOffsetDateTime();
  Long id=target==null?null:Long.valueOf(target);String payload=json.writeValueAsString(in);
  if(id==null){
   if(in.creationKey()==null)throw bad("Creation key is required");
   var old=a.db.queryForList("SELECT promotion_id,creation_payload FROM promotions WHERE dgt_id=? AND creation_key=?",store,in.creationKey());
   if(!old.isEmpty()){if(!json.readTree(old.getFirst().get("creation_payload").toString()).equals(json.readTree(payload)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Creation key reused for different promotion details");return Map.of("id",old.getFirst().get("promotion_id"),"saved",true);}
   id=a.db.queryForObject("INSERT INTO promotions(dgt_id,promotion_name,promotion_type,start_date,end_date,status,discount_value,buy_quantity,free_quantity,is_active,creation_key,creation_payload) VALUES (?,?,?,?,?,'Active',?,?,?,true,?,CAST(? AS jsonb)) RETURNING promotion_id",Long.class,store,in.name().trim(),in.type(),start,end,in.discountValue(),in.buyQty(),in.freeQty(),in.creationKey(),payload);
  }else{
   if(a.db.update("UPDATE promotions SET promotion_name=?,promotion_type=?,start_date=?,end_date=?,discount_value=?,buy_quantity=?,free_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE promotion_id=? AND dgt_id=? AND xmin::text=? AND is_active",in.name().trim(),in.type(),start,end,in.discountValue(),in.buyQty(),in.freeQty(),id,store,version)!=1)throw conflict();
   a.db.update("UPDATE promotion_products SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND promotion_id=? AND dgt_id=?",id,store);
  }
  for(var p:in.products())a.db.update("INSERT INTO promotion_products(promotion_id,product_id,dgt_id,required_quantity) VALUES (?,?,?,?) ON CONFLICT(promotion_id,product_id) DO UPDATE SET required_quantity=EXCLUDED.required_quantity,archived_at=NULL,updated_at=CURRENT_TIMESTAMP",id,p.productId(),store,p.quantity());
  a.audit(store,target==null?"PROMOTION_CREATED":"PROMOTION_UPDATED",id.toString(),payload);return Map.of("id",id,"saved",true);
 }
 public Object applyDeactivate(String store,String target,String version){
  a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  if(a.db.update("UPDATE promotions SET is_active=false,status='Inactive',updated_at=CURRENT_TIMESTAMP WHERE promotion_id=? AND dgt_id=? AND xmin::text=? AND is_active",Long.valueOf(target),store,version)!=1)throw conflict();
  a.audit(store,"PROMOTION_DEACTIVATED",target,"{}");return Map.of("deactivated",true);
 }
}
