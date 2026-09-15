package com.dgt.backend.pricebook;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.util.*;
import java.math.*;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
@Service
public class BulkItemLinks {
 private final ScopedAccess a;private final ObjectMapper json;
 public BulkItemLinks(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 public record Input(String version,Long groupId,String groupVersion,List<Long> vendorIds,List<Long> promotionIds,Map<Long,String> promotionVersions){}
 private ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 private ResponseStatusException conflict(){return new ResponseStatusException(HttpStatus.CONFLICT,"Item links or price group changed; reload before saving");}
 private static final String SNAP="md5(COALESCE((SELECT string_agg(v.product_vendor_id::text||':'||v.xmin::text,',' ORDER BY v.product_vendor_id) FROM product_vendors v WHERE v.archived_at IS NULL AND v.product_id=p.product_id AND v.dgt_id=p.dgt_id),'')||'|'||COALESCE((SELECT string_agg(l.product_price_group_id::text||':'||l.xmin::text||':'||g.xmin::text,',' ORDER BY l.product_price_group_id) FROM product_price_groups l JOIN price_groups g ON g.price_group_id=l.price_group_id AND g.dgt_id=l.dgt_id WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id AND l.is_active),'')||'|'||COALESCE((SELECT string_agg(l.promotion_product_id::text||':'||l.xmin::text||':'||g.xmin::text,',' ORDER BY l.promotion_product_id) FROM promotion_products l JOIN promotions g ON g.promotion_id=l.promotion_id AND g.dgt_id=l.dgt_id WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id),''))";
 public Object options(String store){a.grant(a.user(),store,"PRICE_BOOK",false);
  return Map.of("promotions",a.db.queryForList("SELECT promotion_id AS id,promotion_name AS name,promotion_type AS type,is_active AS active,xmin::text AS version FROM promotions WHERE dgt_id=? ORDER BY promotion_name",store),"groups",a.db.queryForList("SELECT price_group_id AS id,price_group_name AS name,group_price AS price,xmin::text AS version FROM price_groups WHERE dgt_id=? AND is_active ORDER BY price_group_name",store),"vendors",a.db.queryForList("SELECT vendor_id AS id,vendor_name AS name,is_active AS active FROM vendors WHERE dgt_id=? ORDER BY vendor_name",store),"links",a.db.queryForList("SELECT p.product_id AS id,"+SNAP+" AS version,(SELECT l.price_group_id FROM product_price_groups l WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id AND l.is_active) AS \"groupId\",COALESCE((SELECT json_agg(v.vendor_id ORDER BY v.vendor_id) FROM product_vendors v WHERE v.archived_at IS NULL AND v.product_id=p.product_id AND v.dgt_id=p.dgt_id),'[]'::json) AS \"vendorIds\",COALESCE((SELECT json_agg(l.promotion_id ORDER BY l.promotion_id) FROM promotion_products l WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id),'[]'::json) AS \"promotionIds\" FROM products p WHERE p.dgt_id=?",store).stream().map(Rows::normalize).toList());
 }
 public void validate(String store,long product,Input in,PriceBookController.Input item){
  var versions=a.db.queryForList("SELECT "+SNAP+" FROM products p WHERE p.product_id=? AND p.dgt_id=?",String.class,product,store);
  if(versions.size()!=1||!Objects.equals(in.version(),versions.getFirst()))throw conflict();
  if(in.vendorIds()==null||in.vendorIds().size()>200||in.vendorIds().contains(null)||new HashSet<>(in.vendorIds()).size()!=in.vendorIds().size())throw bad("Choose distinct vendors from this store");
  for(Long vendor:in.vendorIds())if(a.db.queryForList("SELECT vendor_id FROM vendors WHERE vendor_id=? AND dgt_id=? AND (is_active OR EXISTS(SELECT 1 FROM product_vendors WHERE product_vendors.archived_at IS NULL AND dgt_id=? AND vendor_id=? AND product_id=?)) FOR SHARE",vendor,store,store,vendor,product).size()!=1)throw bad("Choose an active vendor from this store");
  if(in.groupId()!=null){var groups=a.db.queryForList("SELECT group_price,xmin::text AS version FROM price_groups WHERE price_group_id=? AND dgt_id=? AND is_active FOR UPDATE",in.groupId(),store);if(groups.size()!=1||!Objects.equals(groups.getFirst().get("version"),in.groupVersion()))throw conflict();}
  if(in.promotionIds()!=null){if(in.promotionIds().size()>200||in.promotionIds().contains(null)||new HashSet<>(in.promotionIds()).size()!=in.promotionIds().size())throw bad("Choose distinct promotions");
   for(Long id:in.promotionIds()){var rows=a.db.queryForList("SELECT xmin::text AS version FROM promotions WHERE promotion_id=? AND dgt_id=? AND (is_active OR EXISTS(SELECT 1 FROM promotion_products WHERE promotion_products.archived_at IS NULL AND promotion_id=? AND product_id=? AND dgt_id=?)) FOR UPDATE",id,store,id,product,store);if(rows.size()!=1||in.promotionVersions()==null||!Objects.equals(rows.getFirst().get("version"),in.promotionVersions().get(id)))throw conflict();}
  }

 }
 public void before(String store,long product,Input in){
  var old=a.db.queryForList("SELECT price_group_id FROM product_price_groups WHERE product_price_groups.archived_at IS NULL AND product_id=? AND dgt_id=? AND is_active",Long.class,product,store);
  if(!old.isEmpty()&&!Objects.equals(old.getFirst(),in.groupId())){
   a.db.update("UPDATE product_price_groups SET is_active=false,archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND product_id=? AND dgt_id=? AND is_active",product,store);
   a.db.update("UPDATE price_groups SET updated_at=CURRENT_TIMESTAMP WHERE price_group_id=? AND dgt_id=?",old.getFirst(),store);
  }
 }
 public void after(String store,long product,Input in,PriceBookController.Input item){
  if(in.groupId()!=null&&a.db.queryForList("SELECT product_price_group_id FROM product_price_groups WHERE product_price_groups.archived_at IS NULL AND dgt_id=? AND product_id=? AND is_active",store,product).isEmpty()){
   a.db.update("INSERT INTO product_price_groups(dgt_id,product_id,price_group_id,is_active) VALUES (?,?,?,true) ON CONFLICT(price_group_id,product_id) DO UPDATE SET is_active=true,archived_at=NULL,updated_at=CURRENT_TIMESTAMP",store,product,in.groupId());
   a.db.update("UPDATE price_groups SET updated_at=CURRENT_TIMESTAMP WHERE price_group_id=? AND dgt_id=?",in.groupId(),store);
  }
  var old=a.db.queryForList("SELECT vendor_id FROM product_vendors WHERE product_vendors.archived_at IS NULL AND dgt_id=? AND product_id=?",Long.class,store,product);
  for(Long vendor:old)if(!in.vendorIds().contains(vendor)){a.db.update("UPDATE product_vendors SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND dgt_id=? AND product_id=? AND vendor_id=?",store,product,vendor);a.audit(store,"VENDOR_ITEM_UNLINKED",vendor+":"+product,"{}");}
  for(Long vendor:in.vendorIds())if(!old.contains(vendor)){
   if(item.purchaseGrossCost()==null||item.purchaseDiscount()==null)throw bad("Enter cost and discount before linking a new vendor");
   var cost=item.purchaseGrossCost().subtract(item.purchaseDiscount());
   if("case".equals(item.unitType()))cost=cost.divide(BigDecimal.valueOf(item.unitsPerCase()),2,RoundingMode.HALF_UP);
   a.db.update("INSERT INTO product_vendors(dgt_id,product_id,vendor_id,unit_cost,unit_type,case_pack_quantity) VALUES (?,?,?,?,'ITEM',?) ON CONFLICT(product_id,vendor_id) DO UPDATE SET unit_cost=EXCLUDED.unit_cost,unit_type=EXCLUDED.unit_type,case_pack_quantity=EXCLUDED.case_pack_quantity,archived_at=NULL,updated_at=CURRENT_TIMESTAMP",store,product,vendor,cost,item.unitsPerCase());
   a.audit(store,"VENDOR_ITEM_LINKED",vendor+":"+product,"{}");
  }

  if(in.promotionIds()!=null){var previous=a.db.queryForList("SELECT promotion_id FROM promotion_products WHERE promotion_products.archived_at IS NULL AND dgt_id=? AND product_id=?",Long.class,store,product);
   for(Long id:previous)if(!in.promotionIds().contains(id)){a.db.update("UPDATE promotion_products SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND dgt_id=? AND product_id=? AND promotion_id=?",store,product,id);a.db.update("UPDATE promotions SET updated_at=CURRENT_TIMESTAMP WHERE promotion_id=? AND dgt_id=?",id,store);}
   for(Long id:in.promotionIds())if(!previous.contains(id)){a.db.update("INSERT INTO promotion_products(promotion_id,product_id,dgt_id,required_quantity) VALUES (?,?,?,1) ON CONFLICT(promotion_id,product_id) DO UPDATE SET required_quantity=EXCLUDED.required_quantity,archived_at=NULL,updated_at=CURRENT_TIMESTAMP",id,product,store);a.db.update("UPDATE promotions SET updated_at=CURRENT_TIMESTAMP WHERE promotion_id=? AND dgt_id=?",id,store);}
  }
  a.audit(store,"ITEM_BULK_LINKS_UPDATED",Long.toString(product),json.writeValueAsString(in));
 }
 public Set<Long> touchedPromotions(String store,List<PriceBookController.BulkRow> rows){
  var ids=new HashSet<Long>();for(var row:rows)if(row.links()!=null&&row.links().promotionIds()!=null){ids.addAll(row.links().promotionIds());ids.addAll(a.db.queryForList("SELECT promotion_id FROM promotion_products WHERE promotion_products.archived_at IS NULL AND dgt_id=? AND product_id=?",Long.class,store,row.id()));}return ids;
 }
 public void checkPromotions(String store,Set<Long> ids){
  for(Long id:ids)if(!a.db.queryForList("SELECT promotion_id FROM promotions p WHERE p.dgt_id=? AND p.promotion_id=? AND p.is_active AND NOT EXISTS(SELECT 1 FROM promotion_products l WHERE l.archived_at IS NULL AND l.promotion_id=p.promotion_id AND l.dgt_id=p.dgt_id)",store,id).isEmpty())throw bad("An active promotion must retain at least one item; deactivate it on Promotions first");
 }


}
