package com.dgt.backend.pricebook;

import java.util.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/vendors")
public class StoreVendorController {
 private final ScopedAccess a; private final VendorCostController costs;
 public StoreVendorController(ScopedAccess a,VendorCostController costs){this.a=a;this.costs=costs;}
 public record Input(String name,String email,String phone,String paymentTerms,Integer leadTime,Boolean active,String contactName){}
 public record Link(long productId,BigDecimal unitCost,String unitType,String vendorSku,Integer casePackSize,BigDecimal moq){}
 private void access(String store){a.grant(a.user(),store,"PRICE_BOOK",true);}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private String value(String v,int max){if(v==null||v.isBlank())return null;if(v.trim().length()>max)throw bad("A field exceeds its maximum length");return v.trim();}
 private Map<String,Object> vendor(String store,long id){var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM vendors WHERE vendor_id=? AND dgt_id=?",id,store);if(rows.size()!=1)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Vendor not found in this store");return rows.getFirst();}
 @GetMapping public Object list(@PathVariable String store){access(store);return a.db.queryForList("SELECT v.vendor_id AS id,v.vendor_name AS name,v.email,v.contact_name AS \"contactName\",v.phone_number AS phone,v.payment_terms AS \"paymentTerms\",v.lead_time_days AS \"leadTime\",v.is_active AS active,v.xmin::text AS version,(SELECT count(*) FROM product_vendors pv WHERE pv.archived_at IS NULL AND pv.vendor_id=v.vendor_id AND pv.dgt_id=v.dgt_id) AS \"activeItems\" FROM vendors v WHERE v.dgt_id=? ORDER BY v.vendor_name,v.vendor_id",store).stream().map(Rows::normalize).toList();}
 @PostMapping @Transactional public Object create(@PathVariable String store,@RequestBody Input input){access(store);return save(store,null,null,input);}
 @PutMapping("/{id}") @Transactional public Object update(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestBody Input input){access(store);return save(store,id,version,input);}
 private Object save(String store,Long id,String version,Input in){
  String name=value(in.name(),150),email=value(in.email(),255),phone=value(in.phone(),20),terms=value(in.paymentTerms(),100),contact=value(in.contactName(),150);
  if(name==null)throw bad("Vendor name is required");if(email!=null&&!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))throw bad("Enter a valid email");if(in.leadTime()!=null&&in.leadTime()<0)throw bad("Lead time cannot be negative");if(in.active()==null)throw bad("Active status is required");
  a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  if(id==null){
   id=a.db.queryForObject("INSERT INTO vendors(dgt_id,vendor_name,email,phone_number,payment_terms,lead_time_days,is_active,contact_name) VALUES (?,?,?,?,?,?,?,?) RETURNING vendor_id",Long.class,store,name,email,phone,terms,in.leadTime(),in.active(),contact);
  }else{vendor(store,id);if(a.db.update("UPDATE vendors SET vendor_name=?,email=?,phone_number=?,payment_terms=?,lead_time_days=?,is_active=?,contact_name=?,updated_at=CURRENT_TIMESTAMP WHERE vendor_id=? AND dgt_id=? AND xmin::text=?",name,email,phone,terms,in.leadTime(),in.active(),contact,id,store,version)!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Vendor changed; reload and retry");}
  a.audit(store,"VENDOR_SAVED",id.toString(),"{}");return Map.of("id",id);
 }
 @GetMapping("/{id}/items") public Object items(@PathVariable String store,@PathVariable long id){access(store);vendor(store,id);return a.db.queryForList("SELECT pv.xmin::text AS version,sub.store_sub_department_name AS category,COALESCE(pv.case_pack_quantity,p.units_per_case) AS \"casePackSize\",pv.minimum_order_quantity AS moq,v.lead_time_days AS \"leadTime\",p.product_id AS id,p.product_name AS name,p.product_sku AS sku,p.is_active AS active,pv.unit_cost AS \"unitCost\",pv.unit_type AS \"unitType\",pv.vendor_sku AS \"vendorSku\",(SELECT product_barcode_value FROM product_barcodes b WHERE b.archived_at IS NULL AND b.product_id=p.product_id AND b.dgt_id=p.dgt_id ORDER BY is_primary DESC,product_barcode_id LIMIT 1) AS \"scanCode\" FROM product_vendors pv JOIN products p ON p.product_id=pv.product_id AND p.dgt_id=pv.dgt_id JOIN vendors v ON v.vendor_id=pv.vendor_id AND v.dgt_id=pv.dgt_id JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id WHERE pv.archived_at IS NULL AND pv.dgt_id=? AND pv.vendor_id=? ORDER BY p.product_name",store,id).stream().map(Rows::normalize).toList();}
 @PostMapping("/{id}/items") @Transactional public Object link(@PathVariable String store,@PathVariable long id,@RequestBody Link input){access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);var v=vendor(store,id);if(!Boolean.TRUE.equals(v.get("is_active")))throw bad("Activate the vendor before linking items");
  if(a.db.queryForList("SELECT product_id FROM products WHERE product_id=? AND dgt_id=? AND is_active",input.productId(),store).size()!=1)throw bad("Choose an active item from this store");
  if(input.unitCost()==null||input.unitCost().signum()<0||input.unitCost().scale()>2)throw bad("Unit cost must be non-negative with at most two decimals");if(!Set.of("ITEM","CASE").contains(input.unitType()==null?"":input.unitType()))throw bad("Choose item or case");
  Integer pack=terms(store,input);
  int added=a.db.update("INSERT INTO product_vendors(dgt_id,product_id,vendor_id,unit_cost,unit_type,vendor_sku,case_pack_quantity,minimum_order_quantity) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(product_id,vendor_id) DO UPDATE SET unit_cost=EXCLUDED.unit_cost,unit_type=EXCLUDED.unit_type,vendor_sku=EXCLUDED.vendor_sku,case_pack_quantity=EXCLUDED.case_pack_quantity,minimum_order_quantity=EXCLUDED.minimum_order_quantity,archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE product_vendors.archived_at IS NOT NULL",store,input.productId(),id,input.unitCost(),input.unitType(),value(input.vendorSku(),100),pack,input.moq());
  if(added>0)a.audit(store,"VENDOR_ITEM_LINKED",id+":"+input.productId(),"{}");return Map.of("linked",true,"alreadyLinked",added==0);
 }
 private Integer terms(String store,Link in){
  if(in.unitCost()==null||in.unitCost().signum()<0||in.unitCost().scale()>2||in.unitCost().compareTo(new BigDecimal("99999999.99"))>0)throw bad("Enter a non-negative cost with at most two decimals");
  if(in.unitType()==null||!Set.of("ITEM","CASE").contains(in.unitType()))throw bad("Choose Item or Case");
  Integer pack=in.casePackSize();
  if(pack==null)pack=a.db.queryForObject("SELECT units_per_case FROM products WHERE product_id=? AND dgt_id=?",Integer.class,in.productId(),store);
  if(pack!=null&&pack<=0)throw bad("Case pack must be a positive whole number");
  if("CASE".equals(in.unitType())&&pack==null)throw bad("Enter the number of items in a case");
  if(in.moq()!=null&&(in.moq().signum()<=0||in.moq().scale()>3||in.moq().compareTo(new BigDecimal("999999999.999"))>0))throw bad("Minimum order quantity must be positive with at most three decimals");
  return pack;
 }
 @PutMapping("/{id}/items/{product}") @Transactional public Object editLink(@PathVariable String store,@PathVariable long id,@PathVariable long product,@RequestHeader("If-Match") String version,@RequestBody Link in){
  access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);vendor(store,id);
  var rows=a.db.queryForList("SELECT pv.*,COALESCE(pv.case_pack_quantity,p.units_per_case) AS pack FROM product_vendors pv JOIN products p ON p.product_id=pv.product_id AND p.dgt_id=pv.dgt_id WHERE pv.archived_at IS NULL AND pv.vendor_id=? AND pv.product_id=? AND pv.dgt_id=? AND pv.xmin::text=? FOR UPDATE OF pv",id,product,store,version);
  if(rows.size()!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Vendor item changed or is unavailable; reload and retry");
  if(in.productId()!=product)throw bad("The linked item cannot be replaced; link another item instead");
  Integer pack=terms(store,in);var old=rows.getFirst();BigDecimal oldCost=(BigDecimal)old.get("unit_cost"),newCost=in.unitCost();
  boolean sameBasis=Objects.equals(old.get("unit_type"),in.unitType())&&(!"CASE".equals(in.unitType())||Objects.equals(old.get("pack"),pack));
  if(!sameBasis){
   if("CASE".equals(old.get("unit_type"))&&old.get("pack")!=null)oldCost=oldCost.divide(BigDecimal.valueOf(((Number)old.get("pack")).longValue()),2,java.math.RoundingMode.HALF_UP);
   else if(!"ITEM".equals(old.get("unit_type")))oldCost=null;
   if("CASE".equals(in.unitType()))newCost=newCost.divide(BigDecimal.valueOf(pack),2,java.math.RoundingMode.HALF_UP);
  }
  if(oldCost!=null&&oldCost.compareTo(newCost)!=0)costs.record(store,product,id,oldCost,newCost,sameBasis?"MANUAL:"+in.unitType():"MANUAL:ITEM:PACK_CHANGE",a.user(),a.db.queryForObject("SELECT (CURRENT_TIMESTAMP AT TIME ZONE COALESCE(timezone,'UTC'))::date FROM stores WHERE dgt_id=?",java.sql.Date.class,store));
  a.db.update("UPDATE product_vendors SET unit_cost=?,unit_type=?,vendor_sku=?,case_pack_quantity=?,minimum_order_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_vendor_id=?",in.unitCost(),in.unitType(),value(in.vendorSku(),100),pack,in.moq(),old.get("product_vendor_id"));
  a.audit(store,"VENDOR_ITEM_UPDATED",id+":"+product,"{}");return Map.of("saved",true);
 }
 @DeleteMapping("/{id}/items/{product}") @Transactional public Object unlink(@PathVariable String store,@PathVariable long id,@PathVariable long product,@RequestHeader("If-Match") String version){
  access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);vendor(store,id);
  if(a.db.update("UPDATE product_vendors SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND vendor_id=? AND product_id=? AND dgt_id=? AND xmin::text=?",id,product,store,version)!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Vendor item changed or is unavailable; reload and retry");
  a.audit(store,"VENDOR_ITEM_UNLINKED",id+":"+product,"{}");return Map.of("deleted",true);
 }
 // Only persisted new-item detection from an approved invoice is used, never a caller-supplied flag.
 @PostMapping("/{id}/invoices/{invoiceId}/link-new-items") @Transactional
 public Object linkNewInvoiceItems(@PathVariable String store,@PathVariable long id,@PathVariable long invoiceId){
  access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);vendor(store,id);
  var invoice=a.db.queryForList("SELECT invoice_id FROM invoices WHERE invoice_id=? AND vendor_id=? AND dgt_id=? AND approved_at IS NOT NULL FOR UPDATE",invoiceId,id,store);
  if(invoice.size()!=1)throw bad("Choose an approved invoice for this vendor and store");
  var lines=a.db.queryForList("SELECT gi.product_id,gi.unit_cost,gi.unit_type,gi.vendor_item_code,gi.case_pack_quantity,p.dgt_id FROM grocery_invoice_items gi JOIN products p ON p.product_id=gi.product_id WHERE gi.archived_at IS NULL AND gi.invoice_id=? AND gi.is_product_new ORDER BY gi.grocery_invoice_item_id",invoiceId);
  int created=0;
  for(var line:lines){if(!store.equals(line.get("dgt_id")))throw bad("Invoice item belongs to another store");
   var outcome=(Map<?,?>)link(store,id,new Link(((Number)line.get("product_id")).longValue(),(BigDecimal)line.get("unit_cost"),line.get("unit_type").toString().toUpperCase(Locale.ROOT),(String)line.get("vendor_item_code"),line.get("case_pack_quantity")==null?null:((BigDecimal)line.get("case_pack_quantity")).intValueExact(),null));
   if(Boolean.FALSE.equals(outcome.get("alreadyLinked")))created++;
  }
  return Map.of("linked",created);
 }

 public static final List<String> CONTRACT_TYPES=List.of(
  "Purchase / Supply Agreement","Fixed Price Contract","Tiered / Volume Pricing Contract",
  "Cost-Plus Contract","Volume Incentive Contract","Exclusive Supply Contract","Preferred Vendor Agreement",
  "Delivery / Distribution Agreement","Lease Agreement","Maintenance / Service Contract",
  "Marketing / Display Agreement","Slotting / Placement Agreement");
 public record Contract(long vendorId,String contractType,String contractNumber,LocalDate startDate,LocalDate endDate,
  BigDecimal volumeThreshold,BigDecimal discountValue,String discountType,Integer returnWindowDays,String status,String returnPolicy){}
 @GetMapping("/contracts") public Object contracts(@PathVariable String store){access(store);
  var rows=a.db.queryForList("SELECT c.contact_id AS id,c.xmin::text AS version,c.return_policy AS \"returnPolicy\",c.vendor_id AS \"vendorId\",v.vendor_name AS \"vendorName\",c.contract_type AS \"contractType\",c.contract_number AS \"contractNumber\",c.start_date AS \"startDate\",c.end_date AS \"endDate\",c.volume_threshold AS \"volumeThreshold\",c.volume_discount_value AS \"discountValue\",c.volume_discount_type AS \"discountType\",c.return_window_days AS \"returnWindowDays\",c.status FROM vendor_contacts c JOIN vendors v ON v.vendor_id=c.vendor_id AND v.dgt_id=c.dgt_id WHERE c.dgt_id=? ORDER BY c.created_at DESC,c.contact_id DESC",store);
  return Map.of("discountTypes",DiscountTypes.contracts(a.db),"types",CONTRACT_TYPES,"contracts",rows.stream().map(Rows::normalize).toList());
 }
 @PostMapping("/contracts") @Transactional public Object createContract(@PathVariable String store,@RequestBody Contract in){
  return saveContract(store,null,null,in);
 }
 @PutMapping("/contracts/{id}") @Transactional public Object updateContract(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestBody Contract in){return saveContract(store,id,version,in);}
 private Object saveContract(String store,Long target,String version,Contract in){
  access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  if(target!=null&&a.db.queryForList("SELECT contact_id FROM vendor_contacts WHERE contact_id=? AND dgt_id=? AND xmin::text=? FOR UPDATE",target,store,version).size()!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Contract changed or is unavailable in this store; reload and retry");
  var v=vendor(store,in.vendorId());
  if(!Boolean.TRUE.equals(v.get("is_active")))throw bad("Choose an active vendor");
  if(in.contractType()==null||!CONTRACT_TYPES.contains(in.contractType()))throw bad("Choose a supported contract type");
  if(in.startDate()!=null&&in.endDate()!=null&&in.endDate().isBefore(in.startDate()))throw bad("End date cannot be before start date");
  if(in.status()==null||!Set.of("Draft","Active","Pending","Pending Renewal","Expired","Cancelled").contains(in.status()))throw bad("Choose a valid contract status");
  if(in.returnWindowDays()!=null&&in.returnWindowDays()<0)throw bad("Return window cannot be negative");
  for(BigDecimal n:Arrays.asList(in.volumeThreshold(),in.discountValue()))if(n!=null&&(n.signum()<0||n.scale()>2||n.compareTo(new BigDecimal("99999999.99"))>0))throw bad("Amounts must be non-negative with at most two decimals");
  if(in.discountValue()!=null){if(!DiscountTypes.contractAllowed(a.db,in.discountType()))throw bad("Choose a discount type");if("PERCENT".equals(in.discountType())&&in.discountValue().compareTo(new BigDecimal("100"))>0)throw bad("Percentage cannot exceed 100");}
  else if(in.discountType()!=null&&!in.discountType().isBlank())throw bad("Enter a discount value or clear its type");
  String policy=value(in.returnPolicy(),1000);
  long id;
  if(target==null)id=a.db.queryForObject("INSERT INTO vendor_contacts(vendor_id,dgt_id,contract_type,contract_number,start_date,end_date,volume_threshold,volume_discount_value,volume_discount_type,return_window_days,status,return_policy) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING contact_id",Long.class,in.vendorId(),store,in.contractType(),value(in.contractNumber(),100),in.startDate(),in.endDate(),in.volumeThreshold(),in.discountValue(),in.discountValue()==null?null:in.discountType(),in.returnWindowDays(),in.status(),policy);
  else {id=target;a.db.update("UPDATE vendor_contacts SET vendor_id=?,contract_type=?,start_date=?,end_date=?,volume_discount_value=?,volume_discount_type=?,return_window_days=?,status=?,return_policy=?,updated_at=CURRENT_TIMESTAMP WHERE contact_id=? AND dgt_id=?",in.vendorId(),in.contractType(),in.startDate(),in.endDate(),in.discountValue(),in.discountValue()==null?null:in.discountType(),in.returnWindowDays(),in.status(),policy,id,store);}
  a.audit(store,target==null?"VENDOR_CONTRACT_CREATED":"VENDOR_CONTRACT_UPDATED",Long.toString(id),"{}");return Map.of("id",id);
 }

}
