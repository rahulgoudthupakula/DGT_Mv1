package com.dgt.backend.pricebook;

import java.util.*;
import java.math.BigDecimal;
import com.dgt.backend.access.*;
import com.dgt.backend.departments.service.DefaultDepartmentCatalog;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/items")
public class PriceBookController {
 private final ScopedAccess a; private final ApprovalService approvals; private final DefaultDepartmentCatalog catalog; private final BulkItemLinks bulkLinks;
 public PriceBookController(ScopedAccess a,ApprovalService approvals,DefaultDepartmentCatalog catalog,BulkItemLinks bulkLinks){this.bulkLinks=bulkLinks;this.a=a;this.approvals=approvals;this.catalog=catalog;}
 public record Input(String name,String sku,String barcode,String dept,String subDept,BigDecimal retail,Boolean taxable,Boolean ebtSnap,Boolean allowReturns,Boolean active,Boolean ageRestricted,BigDecimal reorderLevel,String unitType,Integer unitsPerCase,BigDecimal purchaseGrossCost,BigDecimal purchaseDiscount,BigDecimal currentInventory,String inventoryVersion){}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private String text(String value,int max,String name){if(value==null||value.isBlank()||value.trim().length()>max)throw bad(name+" is required (maximum "+max+" characters)");return value.trim();}
 @GetMapping public Object list(@PathVariable String store){
  a.grant(a.user(),store,"PRICE_BOOK",false);
  var rows=a.db.queryForList("SELECT COALESCE((SELECT g.price_group_name FROM product_price_groups l JOIN price_groups g ON g.price_group_id=l.price_group_id AND g.dgt_id=l.dgt_id WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id AND l.is_active AND g.is_active),'') AS \"priceGroup\",COALESCE(linked.vendor,'') AS vendor,COALESCE(linked.names,'[]'::json) AS \"vendorNames\",p.is_age_restricted AS \"ageRestricted\",p.reorder_level AS \"reorderLevel\",lower(p.purchase_unit) AS \"unitType\",p.units_per_case AS \"unitsPerCase\",p.purchase_gross_cost AS \"purchaseGrossCost\",p.purchase_discount AS \"purchaseDiscount\",COALESCE(i.xmin::text,'0') AS \"inventoryVersion\",p.product_id AS id,p.xmin::text AS version,p.product_name AS name,p.product_sku AS sku,p.is_taxable AS taxable,p.is_ebt AS \"ebtSnap\",p.is_returnable AS \"allowReturns\",p.is_active AS active,p.updated_at AS \"lastUpdated\",sd.store_department_name AS dept,sub.store_sub_department_name AS \"subDept\",COALESCE(b.product_barcode_value,'') AS barcode,pr.retail_price AS retail,"+ItemSellingPrice.SQL+" AS \"effectiveRetail\",i.available_quantity AS \"currentInventory\" FROM products p JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id JOIN store_departments sd ON sd.store_department_id=sub.store_department_id AND sd.dgt_id=p.dgt_id LEFT JOIN LATERAL (SELECT product_barcode_value FROM product_barcodes WHERE product_barcodes.archived_at IS NULL AND product_id=p.product_id AND dgt_id=p.dgt_id ORDER BY is_primary DESC,product_barcode_id LIMIT 1) b ON true LEFT JOIN product_store_prices pr ON pr.product_id=p.product_id AND pr.dgt_id=p.dgt_id LEFT JOIN inventory i ON i.product_id=p.product_id AND i.dgt_id=p.dgt_id LEFT JOIN LATERAL (SELECT string_agg(v.vendor_name,', ' ORDER BY v.vendor_name,v.vendor_id) AS vendor,json_agg(v.vendor_name ORDER BY v.vendor_name,v.vendor_id) AS names FROM product_vendors pv JOIN vendors v ON v.vendor_id=pv.vendor_id AND v.dgt_id=pv.dgt_id WHERE pv.archived_at IS NULL AND pv.product_id=p.product_id AND pv.dgt_id=p.dgt_id) linked ON true WHERE p.dgt_id=? ORDER BY p.product_name,p.product_id",store);
  boolean edit;try{a.grant(a.user(),store,"PRICE_BOOK",true);edit=true;}catch(ResponseStatusException e){edit=false;}
  return Map.of("items",rows.stream().map(this::details).map(com.dgt.backend.common.entity.Rows::normalize).toList(),"departments",departments(store),"canEdit",edit);
 }
 private Map<String,Object> details(Map<String,Object> row){
  for(String key:List.of("cost","itemGrossCost","itemDiscount","itemNetCost","caseGrossCost","caseDiscount","caseNetCost"))row.put(key,null);
  BigDecimal gross=(BigDecimal)row.get("purchaseGrossCost"),discount=(BigDecimal)row.get("purchaseDiscount");
  Integer units=(Integer)row.get("unitsPerCase");
  if(gross!=null&&discount!=null){
   BigDecimal divisor="case".equals(row.get("unitType"))?BigDecimal.valueOf(units):BigDecimal.ONE;
   BigDecimal itemGross=gross.divide(divisor,6,java.math.RoundingMode.HALF_UP),itemDiscount=discount.divide(divisor,6,java.math.RoundingMode.HALF_UP);
   row.put("itemGrossCost",itemGross);row.put("itemDiscount",itemDiscount);row.put("itemNetCost",itemGross.subtract(itemDiscount));row.put("cost",itemGross.subtract(itemDiscount));
   if(units!=null){row.put("caseGrossCost",itemGross.multiply(BigDecimal.valueOf(units)));row.put("caseDiscount",itemDiscount.multiply(BigDecimal.valueOf(units)));row.put("caseNetCost",itemGross.subtract(itemDiscount).multiply(BigDecimal.valueOf(units)));}
  }
  return row;
 }
 private void amount(BigDecimal value,int scale,String label){if(value!=null&&(value.signum()<0||value.scale()>scale||value.compareTo(new BigDecimal("99999999.99"))>0))throw bad(label+" must be non-negative with at most "+scale+" decimals");}
 private void saveDetails(String store,long id,Input in){
  amount(in.reorderLevel(),3,"Reorder level");amount(in.currentInventory(),3,"Current count");amount(in.purchaseGrossCost(),2,"Gross cost");amount(in.purchaseDiscount(),2,"Discount");
  if(in.unitType()!=null&&!Set.of("item","case").contains(in.unitType()))throw bad("Choose Item or Case");
  if(in.unitsPerCase()!=null&&in.unitsPerCase()<=0)throw bad("Units per case must be positive");
  if("case".equals(in.unitType())&&in.unitsPerCase()==null)throw bad("Enter units per case");
  if((in.purchaseGrossCost()==null)!=(in.purchaseDiscount()==null))throw bad("Enter both gross cost and discount");
  if(in.purchaseGrossCost()!=null&&(in.unitType()==null||in.purchaseDiscount().compareTo(in.purchaseGrossCost())>0))throw bad("Discount cannot exceed gross cost; choose a unit type");
  var old=a.db.queryForMap("SELECT purchase_gross_cost,purchase_discount,purchase_unit,units_per_case FROM products WHERE product_id=? AND dgt_id=?",id,store);
  a.db.update("UPDATE products SET is_age_restricted=COALESCE(?,is_age_restricted),reorder_level=?,purchase_unit=?,units_per_case=?,purchase_gross_cost=?,purchase_discount=? WHERE product_id=? AND dgt_id=?",in.ageRestricted(),in.reorderLevel(),in.unitType()==null?null:in.unitType().toUpperCase(Locale.ROOT),in.unitsPerCase(),in.purchaseGrossCost(),in.purchaseDiscount(),id,store);
  BigDecimal oldGross=(BigDecimal)old.get("purchase_gross_cost"),oldDiscount=(BigDecimal)old.get("purchase_discount");
  if(oldGross!=null&&oldDiscount!=null&&in.purchaseGrossCost()!=null){
   BigDecimal before=oldGross.subtract(oldDiscount).divide("CASE".equals(old.get("purchase_unit"))?BigDecimal.valueOf(((Number)old.get("units_per_case")).longValue()):BigDecimal.ONE,6,java.math.RoundingMode.HALF_UP);
   BigDecimal after=in.purchaseGrossCost().subtract(in.purchaseDiscount()).divide("case".equals(in.unitType())?BigDecimal.valueOf(in.unitsPerCase()):BigDecimal.ONE,6,java.math.RoundingMode.HALF_UP);
   if(before.compareTo(after)!=0){
    BigDecimal percentage=before.signum()==0?null:after.subtract(before).multiply(BigDecimal.valueOf(100)).divide(before,2,java.math.RoundingMode.HALF_UP);
    a.audit(store,"ITEM_CATALOG_COST_CHANGED",Long.toString(id),"{\"oldCost\":"+before+",\"newCost\":"+after+",\"change\":"+percentage+"}");
   }
  }
  if(in.currentInventory()!=null){
   var rows=a.db.queryForList("SELECT available_quantity,xmin::text AS version FROM inventory WHERE dgt_id=? AND product_id=? FOR UPDATE",store,id);
   String actual=rows.isEmpty()?"0":(String)rows.getFirst().get("version");
   if(!Objects.equals(actual,in.inventoryVersion()==null?"0":in.inventoryVersion()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Inventory changed; reload before saving the count");
   BigDecimal oldQty=rows.isEmpty()?BigDecimal.ZERO:(BigDecimal)rows.getFirst().get("available_quantity");
   if(rows.isEmpty())a.db.update("INSERT INTO inventory(dgt_id,product_id,available_quantity) VALUES (?,?,?)",store,id,in.currentInventory());
   else if(oldQty.compareTo(in.currentInventory())!=0)a.db.update("UPDATE inventory SET available_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND product_id=?",in.currentInventory(),store,id);
   if(oldQty.compareTo(in.currentInventory())!=0){
    BigDecimal unitCost=in.purchaseGrossCost()==null?BigDecimal.ZERO:in.purchaseGrossCost().subtract(in.purchaseDiscount()).divide("case".equals(in.unitType())?BigDecimal.valueOf(in.unitsPerCase()):BigDecimal.ONE,2,java.math.RoundingMode.HALF_UP);
    a.db.update("INSERT INTO inventory_movements(dgt_id,product_id,movement_type,qty_changed,unit_cost) VALUES (?,?,'ADJUSTMENT',?,?)",store,id,in.currentInventory().subtract(oldQty),unitCost);
    a.audit(store,"ITEM_COUNT_ADJUSTED",Long.toString(id),"{\"previous\":"+oldQty+",\"current\":"+in.currentInventory()+"}");
   }
  }
 }
 private List<Map<String,Object>> departments(String store){
  var result=new ArrayList<Map<String,Object>>();
  for(var d:a.db.queryForList("SELECT department_name FROM departments d WHERE is_default AND NOT EXISTS(SELECT 1 FROM store_departments s WHERE s.dgt_id=? AND s.department_id=d.department_id AND NOT s.is_active) ORDER BY department_name",store)){
   String name=(String)d.get("department_name");if(catalog.contains(name))result.add(Map.of("name",name,"children",catalog.children(name)));
  }
  for(var d:a.db.queryForList("SELECT store_department_id,store_department_name FROM store_departments WHERE dgt_id=? AND is_active AND (source_type<>'DEFAULT' OR department_id IS NULL)",store)){
   result.add(Map.of("name",d.get("store_department_name"),"children",a.db.queryForList("SELECT store_sub_department_name FROM store_sub_departments WHERE store_department_id=? AND dgt_id=? AND is_active ORDER BY store_sub_department_name",String.class,d.get("store_department_id"),store)));
  }return result;
 }
 public record BulkRow(Long id,String version,Input item,BulkItemLinks.Input links){}
 @GetMapping("/bulk-options") public Object bulkOptions(@PathVariable String store){return bulkLinks.options(store);}
 public record BulkInput(List<BulkRow> rows){}
 @PostMapping("/bulk") @Transactional public Object bulk(@PathVariable String store,@RequestBody BulkInput input,@RequestHeader("Idempotency-Key") String key){return approvals.submit(store,"ITEM_BULK_UPDATE",null,null,input,key);}
 public Object applyBulk(String store,BulkInput input){
  if(input.rows()==null||input.rows().isEmpty()||input.rows().size()>200)throw bad("Choose 1 to 200 changed items per save");
  var ids=new HashSet<Long>();
  for(var row:input.rows())if(row==null||row.id()==null||row.version()==null||row.item()==null||!ids.add(row.id()))throw bad("Each item must have a unique ID, version and details");
  a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  var touchedPromotions=bulkLinks.touchedPromotions(store,input.rows());
  for(var row:input.rows())if(row.links()!=null)bulkLinks.validate(store,row.id(),row.links(),row.item());
  for(var row:input.rows()){
   if(row.links()!=null)bulkLinks.before(store,row.id(),row.links());
   apply(store,row.id().toString(),row.version(),row.item());
   if(row.links()!=null)bulkLinks.after(store,row.id(),row.links(),row.item());
  }
  bulkLinks.checkPromotions(store,touchedPromotions);
  a.audit(store,"ITEM_BULK_UPDATED",store,"{\"count\":"+input.rows().size()+"}");return Map.of("saved",true,"count",input.rows().size());
 }

 @PostMapping @Transactional public Object create(@PathVariable String store,@RequestBody Input input,@RequestHeader("Idempotency-Key") String key){return approvals.submit(store,"ITEM_CREATE",null,null,input,key);}
 @PutMapping("/{id}") @Transactional public Object update(@PathVariable String store,@PathVariable long id,@RequestBody Input input,@RequestHeader("If-Match") String version,@RequestHeader("Idempotency-Key") String key){return approvals.submit(store,"ITEM_UPDATE",Long.toString(id),version,input,key);}
 public Object apply(String store,String target,String version,Input input){
  a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  String name=text(input.name(),200,"Item name"),sku=text(input.sku(),100,"SKU"),dept=text(input.dept(),150,"Department"),sub=text(input.subDept(),150,"Subdepartment");
  String barcode=input.barcode()==null?"":input.barcode().trim();if(barcode.length()>100)throw bad("Barcode must not exceed 100 characters");
  if(input.retail()==null||input.retail().signum()<0||input.retail().scale()>2||input.retail().compareTo(new BigDecimal("99999999.99"))>0)throw bad("Retail price must be a non-negative amount with at most two decimals");
  if(input.taxable()==null||input.ebtSnap()==null||input.allowReturns()==null||input.active()==null)throw bad("Item settings are required");
  Long id=target==null?null:Long.valueOf(target);
  if(id!=null&&a.db.queryForList("SELECT product_id FROM products WHERE product_id=? AND dgt_id=? AND xmin::text=? FOR UPDATE",id,store,version).size()!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Item changed or is unavailable in this store; reload and retry");

  if(Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM products WHERE dgt_id=? AND product_sku=? AND (?::bigint IS NULL OR product_id<>?))",Boolean.class,store,sku,id,id)))throw bad("This SKU already belongs to an item in this store");
  if(!barcode.isEmpty()&&Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM product_barcodes WHERE dgt_id=? AND product_barcode_value=? AND (?::bigint IS NULL OR product_id<>?))",Boolean.class,store,barcode,id,id)))throw bad("This barcode already belongs to an item in this store");
  if(departments(store).stream().noneMatch(d->dept.equals(d.get("name"))&&((List<?>)d.get("children")).contains(sub)))throw bad("Choose an active department and subdepartment for this store");
  var depIds=a.db.queryForList("SELECT store_department_id FROM store_departments WHERE dgt_id=? AND store_department_name=? AND is_active",Long.class,store,dept);
  long depId;
  if(depIds.isEmpty())depId=a.db.queryForObject("INSERT INTO store_departments(dgt_id,department_id,store_department_name,source_type) SELECT ?,department_id,department_name,'DEFAULT' FROM departments WHERE department_name=? AND is_default RETURNING store_department_id",Long.class,store,dept);
  else if(depIds.size()==1)depId=depIds.getFirst();else throw bad("Duplicate departments need review");
  var subs=a.db.queryForList("SELECT store_sub_department_id FROM store_sub_departments WHERE dgt_id=? AND store_department_id=? AND store_sub_department_name=? AND is_active",Long.class,store,depId,sub);
  long subId=subs.isEmpty()?a.db.queryForObject("INSERT INTO store_sub_departments(dgt_id,store_department_id,store_sub_department_name,source_type) VALUES (?,?,?,'DEFAULT') RETURNING store_sub_department_id",Long.class,store,depId,sub):subs.getFirst();
  if(id==null)id=a.db.queryForObject("INSERT INTO products(dgt_id,store_sub_department_id,product_name,product_sku,is_taxable,is_ebt,is_returnable,is_active) VALUES (?,?,?,?,?,?,?,?) RETURNING product_id",Long.class,store,subId,name,sku,input.taxable(),input.ebtSnap(),input.allowReturns(),input.active());
  else a.db.update("UPDATE products SET store_sub_department_id=?,product_name=?,product_sku=?,is_taxable=?,is_ebt=?,is_returnable=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND dgt_id=?",subId,name,sku,input.taxable(),input.ebtSnap(),input.allowReturns(),input.active(),id,store);
  // Archive the displayed mapping; retain other barcodes and reactivate an existing identity.
  var existing=a.db.queryForList("SELECT product_barcode_id,product_barcode_value FROM product_barcodes WHERE archived_at IS NULL AND product_id=? AND dgt_id=? ORDER BY is_primary DESC,product_barcode_id LIMIT 1",id,store);
  if(existing.isEmpty()||!Objects.equals(existing.getFirst().get("product_barcode_value"),barcode)){
   if(!existing.isEmpty())a.db.update("UPDATE product_barcodes SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE product_barcode_id=? AND dgt_id=? AND archived_at IS NULL",existing.getFirst().get("product_barcode_id"),store);
   if(!barcode.isEmpty())a.db.update("INSERT INTO product_barcodes(dgt_id,product_id,product_barcode_type,product_barcode_value,is_primary) VALUES (?,?,'OTHER',?,true) ON CONFLICT(dgt_id,product_barcode_value) DO UPDATE SET archived_at=NULL,is_primary=true,updated_at=CURRENT_TIMESTAMP WHERE product_barcodes.product_id=EXCLUDED.product_id",store,id,barcode);
  }
  a.db.update("INSERT INTO product_store_prices(dgt_id,product_id,retail_price) VALUES (?,?,?) ON CONFLICT(dgt_id,product_id) DO UPDATE SET retail_price=EXCLUDED.retail_price,updated_at=CURRENT_TIMESTAMP",store,id,input.retail());
  saveDetails(store,id,input);
  return Map.of("id",id,"saved",true);
 }
}
