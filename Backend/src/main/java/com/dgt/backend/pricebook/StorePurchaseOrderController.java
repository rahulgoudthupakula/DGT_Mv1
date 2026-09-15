package com.dgt.backend.pricebook;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
import java.math.*;
import java.time.*;
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/purchase-orders")
public class StorePurchaseOrderController {
 private final ScopedAccess a;public StorePurchaseOrderController(ScopedAccess a){this.a=a;}
 private boolean allowed(String store,boolean review){
  long uid=a.user();if(a.admin(uid,a.company(store)))return true;
  return !a.db.queryForList("SELECT ur.user_role_id FROM user_roles ur JOIN role_types rt USING(role_type_id) JOIN store_role_permissions rp ON rp.dgt_id=ur.dgt_id AND rp.role_type_id=ur.role_type_id WHERE ur.user_id=? AND ur.dgt_id=? AND ur.is_active AND rt.is_active AND rp.allowed AND rp.permission_code=? AND (?=false OR upper(rt.role_type_name)='MANAGER')",uid,store,review?"GROCERY_APPROVE_PO":"GROCERY_CREATE_PO",review).isEmpty();
 }
 private void access(String store){if(!allowed(store,false)&&!allowed(store,true))throw a.denied();}
 private void creator(String store){if(!allowed(store,false))throw a.denied();}
 @GetMapping("/permissions") public Object permissions(@PathVariable String store){access(store);return Map.of("canCreate",allowed(store,false),"canApprove",allowed(store,true));}
 private boolean editable(String store,Map<String,Object> order){return allowed(store,true)||((Number)order.get("created_by")).longValue()==a.user();}
 private RuntimeException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 private RuntimeException conflict(String m){return new ResponseStatusException(HttpStatus.CONFLICT,m);}
 private static final String CATALOG="SELECT p.product_id,p.product_sku AS sku,p.product_name AS name,COALESCE((SELECT product_barcode_value FROM product_barcodes b WHERE b.archived_at IS NULL AND b.product_id=p.product_id AND b.dgt_id=p.dgt_id ORDER BY is_primary DESC,product_barcode_id LIMIT 1),'') AS barcode,d.store_department_name AS dept,sub.store_sub_department_name AS category,v.vendor_name AS vendor,v.vendor_id,v.lead_time_days,COALESCE(i.available_quantity,0) AS stock,COALESCE(pv.case_pack_quantity,p.units_per_case,1) AS pack,COALESCE(pv.minimum_order_quantity,1) AS moq,COALESCE(p.reorder_level,0) AS target,(p.purchase_gross_cost-p.purchase_discount)/CASE WHEN p.purchase_unit='CASE' THEN NULLIF(p.units_per_case,0) ELSE 1 END AS cost FROM products p JOIN product_vendors pv ON pv.archived_at IS NULL AND pv.product_id=p.product_id AND pv.dgt_id=p.dgt_id JOIN vendors v ON v.vendor_id=pv.vendor_id AND v.dgt_id=p.dgt_id JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id LEFT JOIN inventory i ON i.product_id=p.product_id AND i.dgt_id=p.dgt_id WHERE p.dgt_id=? AND p.is_active AND v.is_active";
 @GetMapping("/catalog") public Object catalog(@PathVariable String store){access(store);return a.db.queryForList(CATALOG+" ORDER BY v.vendor_name,p.product_name",store).stream().map(Rows::normalize).toList();}
 @GetMapping public Object list(@PathVariable String store){access(store);var rows=a.db.queryForList("SELECT p.purchase_order_id::text AS id,p.xmin::text AS version,p.po_number AS \"poNumber\",v.vendor_name AS vendor,p.order_date AS \"orderDate\",p.expected_delivery_date AS \"expectedDeliveryDate\",p.status,p.source,p.notes,p.created_by,p.approved_at AS \"approvedAt\",p.created_at AS \"createdAt\" FROM purchase_orders p JOIN vendors v ON v.vendor_id=p.vendor_id AND v.dgt_id=p.dgt_id WHERE p.dgt_id=? ORDER BY p.purchase_order_id DESC",store);
  for(var r:rows){var lines=a.db.queryForList("SELECT purchase_order_line_id::text AS id,sku,barcode,item_name AS \"itemName\",department,ordered_quantity AS \"orderedQuantity\",received_quantity AS \"receivedQuantity\",case_pack_size AS \"casePackSize\",unit_cost AS \"unitCost\",round(ordered_quantity*unit_cost,2) AS \"lineTotal\" FROM purchase_order_lines WHERE purchase_order_id=? ORDER BY purchase_order_line_id",Long.parseLong((String)r.get("id")));r.put("canEdit",allowed(store,false)&&editable(store,r)&&"Draft".equals(r.get("status")));r.put("canApprove",allowed(store,true)&&"Pending Approval".equals(r.get("status")));r.put("canCancel",editable(store,r)&&Set.of("Draft","Pending Approval").contains(r.get("status")));r.remove("created_by");r.put("lines",lines);r.put("totalItems",lines.size());r.put("totalQuantity",lines.stream().map(l->(BigDecimal)l.get("orderedQuantity")).reduce(BigDecimal.ZERO,BigDecimal::add));r.put("totalValue",lines.stream().map(l->(BigDecimal)l.get("lineTotal")).reduce(BigDecimal.ZERO,BigDecimal::add));}return rows.stream().map(Rows::normalize).toList();
 }
 public record Line(String sku,BigDecimal orderedQuantity){}
 public record Create(String vendor,String source,LocalDate expectedDeliveryDate,String notes,List<Line> lines){}
 private void lockStore(String store){a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);}
 @PostMapping @Transactional public Object create(@PathVariable String store,@RequestHeader("Idempotency-Key") UUID key,@RequestBody Create in){creator(store);lockStore(store);
  var previous=a.db.queryForList("SELECT po_number FROM purchase_orders WHERE dgt_id=? AND request_key=?",String.class,store,key);if(!previous.isEmpty())return Map.of("po_number",previous.getFirst());
  if(in.source()==null||!Set.of("Suggested Order Guide","Vendor Order Guide").contains(in.source())||in.notes()!=null&&in.notes().length()>4000)throw bad("Invalid source or notes");
  var vendors=a.db.queryForList("SELECT vendor_id FROM vendors WHERE dgt_id=? AND vendor_name=? AND is_active",Long.class,store,in.vendor());if(vendors.size()!=1)throw bad("Choose an active store vendor");long vid=vendors.getFirst();
  String zone=a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store);LocalDate date=LocalDate.now(ZoneId.of(zone==null?"UTC":zone));if(in.expectedDeliveryDate()!=null&&in.expectedDeliveryDate().isBefore(date))throw bad("Expected delivery cannot be before the order date");String number="PO-"+date.toString().replace("-","")+"-"+UUID.randomUUID().toString().substring(0,8).toUpperCase();
  long id=a.db.queryForObject("INSERT INTO purchase_orders(dgt_id,vendor_id,po_number,order_date,expected_delivery_date,source,notes,created_by,request_key) VALUES (?,?,?,?,?,?,?,?,?) RETURNING purchase_order_id",Long.class,store,vid,number,date,in.expectedDeliveryDate(),in.source(),in.notes(),a.user(),key);add(store,id,vid,in.lines());a.audit(store,"PO_CREATED",Long.toString(id),"{}");return Map.of("po_number",number);
 }
 private void add(String store,long id,long vendor,List<Line> lines){if(lines==null||lines.isEmpty()||lines.size()>200)throw bad("Choose 1–200 items");Set<String> seen=new HashSet<>();for(Line l:lines){if(l==null||l.sku()==null||!seen.add(l.sku())||l.orderedQuantity()==null||l.orderedQuantity().signum()<=0||l.orderedQuantity().scale()>3||l.orderedQuantity().compareTo(new BigDecimal("999999999"))>0)throw bad("Use unique items with positive quantities (up to three decimals)");var products=a.db.queryForList(CATALOG+" AND v.vendor_id=? AND p.product_sku=?",store,vendor,l.sku());if(products.size()!=1)throw bad("Item must belong to this store and be linked to this vendor");var p=products.getFirst();if(p.get("cost")==null)throw bad("Set the item's cost first");BigDecimal cost=((BigDecimal)p.get("cost")).setScale(2,RoundingMode.HALF_UP);
  a.db.update("INSERT INTO purchase_order_lines(purchase_order_id,product_id,sku,barcode,item_name,department,ordered_quantity,case_pack_size,unit_cost) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(purchase_order_id,product_id) DO UPDATE SET ordered_quantity=purchase_order_lines.ordered_quantity+EXCLUDED.ordered_quantity",id,p.get("product_id"),p.get("sku"),p.get("barcode"),p.get("name"),p.get("dept"),l.orderedQuantity(),p.get("pack"),cost);
 }}
 private Map<String,Object> lock(String store,long id,String version){access(store);lockStore(store);var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM purchase_orders WHERE purchase_order_id=? AND dgt_id=? FOR UPDATE",id,store);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);var r=rows.getFirst();if(!Objects.equals(version,r.get("version")))throw conflict("Purchase order changed; reload before continuing");return r;}
 @PostMapping("/{id}/lines") @Transactional public Object lines(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestBody List<Line> lines){var r=lock(store,id,version);creator(store);if(!editable(store,r))throw a.denied();if(!"Draft".equals(r.get("status")))throw conflict("Only draft orders can be changed");add(store,id,((Number)r.get("vendor_id")).longValue(),lines);a.db.update("UPDATE purchase_orders SET updated_at=CURRENT_TIMESTAMP WHERE purchase_order_id=?",id);a.audit(store,"PO_LINES_ADDED",Long.toString(id),"{}");return Map.of("saved",true);}
 public record Status(String status){}
 @PostMapping("/{id}/status") @Transactional public Object status(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestBody Status in){
  var r=lock(store,id,version);String old=(String)r.get("status");
  if("Approved".equals(in.status())){
   if(!allowed(store,true))throw a.denied();
   if(!"Pending Approval".equals(old))throw conflict("Only pending purchase orders can be approved");
   a.db.update("UPDATE purchase_orders SET status='Approved',approved_by=?,approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE purchase_order_id=?",a.user(),id);
  }else{
   if(!editable(store,r))throw a.denied();
   if("Pending Approval".equals(in.status()))creator(store);
   if(!(("Pending Approval".equals(in.status())&&"Draft".equals(old))||("Cancelled".equals(in.status())&&Set.of("Draft","Pending Approval").contains(old))))throw conflict("Invalid status change");
   a.db.update("UPDATE purchase_orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE purchase_order_id=?",in.status(),id);
  }
  a.audit(store,"PO_"+in.status().toUpperCase().replace(' ','_'),Long.toString(id),"{}");return Map.of("status",in.status());
 }
}
