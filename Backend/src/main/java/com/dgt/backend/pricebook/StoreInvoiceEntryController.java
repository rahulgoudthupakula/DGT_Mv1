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
import java.time.LocalDate;
import java.time.LocalTime;
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/invoice-entry")
public class StoreInvoiceEntryController {
 private final ScopedAccess a;
 public StoreInvoiceEntryController(ScopedAccess a){this.a=a;}
 public record Line(String sku,String barcode,String itemName,BigDecimal quantity,String unitType,Integer unitsPerCase,BigDecimal unitCost,BigDecimal msrp,BigDecimal receivedQuantity,BigDecimal tax){}
 public record Input(String vendor,String invoice,LocalDate deliveryDate,List<Line> lines,Long purchaseOrderId,LocalDate invoiceDate,LocalDate dueDate,LocalTime deliveryTime,String driverName,String driverNumber,String routeId,String terms,String notes,BigDecimal freight,BigDecimal fuelSurcharge,BigDecimal handlingFee,BigDecimal discount){}
 private RuntimeException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 private void access(String store){a.grant(a.user(),store,"PRICE_BOOK",true);}
 private String text(String s,int max){if(s==null||s.isBlank()||s.trim().length()>max)throw bad("Required text is missing or too long");return s.trim();}
 private String optional(String value,int max){if(value==null||value.isBlank())return null;if(value.trim().length()>max)throw bad("Text exceeds "+max+" characters");return value.trim();}
 private BigDecimal amount(BigDecimal value){if(value==null)return BigDecimal.ZERO;money(value);return value;}
 private void money(BigDecimal v){if(v==null||v.signum()<0||v.scale()>2||v.compareTo(new BigDecimal("99999999.99"))>0)throw bad("Use a nonnegative amount with at most two decimals");}
 private List<Map<String,Object>> headers(String store,Long id){return a.db.queryForList("""
  SELECT i.invoice_id AS id,i.invoice_number AS "invoiceNumber",i.invoice_date AS "invoiceDate",
   COALESCE(i.received_date::text,'') AS "deliveryDate",COALESCE(i.delivery_time::text,'') AS "deliveryTime",
   concat_ws(' ',i.received_date::text,i.delivery_time::text) AS "deliveryDateTime",COALESCE(i.due_date::text,'') AS "dueDate",
   COALESCE(i.driver_name,'') AS "driverName",COALESCE(i.driver_number,'') AS "driverNumber",COALESCE(i.route_id,'') AS "routeId",
   COALESCE(i.payment_terms,'') AS "termsNet",COALESCE(i.notes,'') AS notes,
   i.purchase_order_id::text AS "purchaseOrderId",COALESCE(po.po_number,'') AS "poNumber",v.vendor_name AS "vendorName",
   COALESCE(v.phone_number,'') AS "vendorPhone",COALESCE(v.contact_name,'') AS "salesRepName",
   concat_ws(' ',creator.first_name,creator.last_name) AS "createdBy",concat_ws(' ',reviewer.first_name,reviewer.last_name) AS "approvedBy",i.approved_at AS "approvedAt",
   CASE WHEN i.approved_at IS NULL THEN 'Pending' ELSE 'Approved' END AS status,
   COALESCE(sum(l.item_line_total),0) AS subtotal,COALESCE(sum(l.line_tax),0) AS tax,
   COALESCE(c.freight_amount,0) AS freight,COALESCE(c.fuel_surcharge,0) AS "fuelSurcharge",COALESCE(c.handling_fee,0) AS "handlingFee",COALESCE(c.discounted_amount,0) AS discount,
   COALESCE(c.freight_amount+c.fuel_surcharge+c.handling_fee-c.discounted_amount,0) AS "otherCharges",
   COALESCE(sum(l.item_line_total+l.line_tax),0)+COALESCE(c.freight_amount+c.fuel_surcharge+c.handling_fee-c.discounted_amount,0) AS total,
   CASE WHEN c.payment_status IS NULL THEN '' ELSE initcap(c.payment_status) END AS "paymentStatus"
  FROM invoices i JOIN vendors v ON v.vendor_id=i.vendor_id AND v.dgt_id=i.dgt_id
  LEFT JOIN purchase_orders po ON po.purchase_order_id=i.purchase_order_id AND po.dgt_id=i.dgt_id
  LEFT JOIN grocery_invoice_items l ON l.archived_at IS NULL AND l.invoice_id=i.invoice_id
  LEFT JOIN invoice_charges c ON c.invoice_id=i.invoice_id AND c.charge_type='GROCERY'
  LEFT JOIN users creator ON creator.user_id=i.received_by LEFT JOIN users reviewer ON reviewer.user_id=i.approved_by
  WHERE i.dgt_id=? AND i.invoice_type='GROCERY' AND (?::bigint IS NULL OR i.invoice_id=?)
  GROUP BY i.invoice_id,v.vendor_id,po.po_number,c.invoice_charge_id,creator.user_id,reviewer.user_id ORDER BY i.invoice_id DESC
  """,store,id,id).stream().map(Rows::normalize).toList();}
 @GetMapping public Object list(@PathVariable String store){access(store);return Map.of("invoices",headers(store,null),"vendors",a.db.queryForList("SELECT vendor_name AS name,COALESCE(payment_terms,'') AS terms FROM vendors WHERE dgt_id=? AND is_active ORDER BY vendor_name",store));}
 @GetMapping("/pending-pos") public Object pendingOrders(@PathVariable String store){access(store);
  var orders=a.db.queryForList("SELECT po.purchase_order_id::text AS id,po.po_number AS \"poNumber\",v.vendor_name AS vendor FROM purchase_orders po JOIN vendors v ON v.vendor_id=po.vendor_id AND v.dgt_id=po.dgt_id WHERE po.dgt_id=? AND po.status='Approved' ORDER BY po.purchase_order_id DESC",store);
  for(var order:orders){var lines=a.db.queryForList("SELECT p.sku,p.barcode,p.item_name AS \"itemName\",p.ordered_quantity AS \"orderedQuantity\",p.case_pack_size AS \"casePackSize\",p.unit_cost AS \"unitCost\",COALESCE((SELECT sum(COALESCE(l.received_quantity,l.quantity)*CASE WHEN l.unit_type='CASE' THEN l.case_pack_quantity ELSE 1 END) FROM grocery_invoice_items l JOIN invoices i ON i.invoice_id=l.invoice_id WHERE l.archived_at IS NULL AND i.purchase_order_id=p.purchase_order_id AND i.approved_at IS NOT NULL AND i.dgt_id=? AND l.product_id=p.product_id),0) AS \"previouslyReceived\" FROM purchase_order_lines p WHERE p.purchase_order_id=? ORDER BY p.purchase_order_line_id",store,Long.parseLong((String)order.get("id")));order.put("lines",lines);order.put("pending",lines.stream().anyMatch(l->((BigDecimal)l.get("previouslyReceived")).compareTo((BigDecimal)l.get("orderedQuantity"))<0));}
  return orders.stream().map(Rows::normalize).toList();
 }
 @GetMapping("/{id}") public Object detail(@PathVariable String store,@PathVariable long id){access(store);var headers=a.db.queryForList("SELECT xmin::text AS version,purchase_order_id::text AS \"purchaseOrderId\" FROM invoices WHERE invoice_id=? AND dgt_id=? AND invoice_type='GROCERY'",id,store);if(headers.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  var result=new LinkedHashMap<String,Object>(headers.getFirst());result.put("invoice",headers(store,id).getFirst());result.put("items",a.db.queryForList("SELECT l.grocery_invoice_item_id AS id,p.product_name AS \"itemName\",p.product_sku AS \"scanCode\",l.quantity AS \"invoicedQty\",COALESCE(l.received_quantity,l.quantity) AS \"receivedQty\",pol.ordered_quantity/CASE WHEN l.unit_type='CASE' THEN l.case_pack_quantity ELSE 1 END AS \"orderedQty\",l.unit_cost AS \"unitCost\",l.msrp,l.unit_type AS \"unitType\",l.case_pack_quantity AS \"casePack\",l.item_line_total AS \"extendedCost\",l.line_tax AS tax,l.item_line_total+l.line_tax AS total FROM grocery_invoice_items l JOIN invoices i ON i.invoice_id=l.invoice_id JOIN products p ON p.product_id=l.product_id AND p.dgt_id=i.dgt_id LEFT JOIN purchase_order_lines pol ON pol.purchase_order_id=i.purchase_order_id AND pol.product_id=l.product_id WHERE l.archived_at IS NULL AND i.invoice_id=? AND i.dgt_id=? ORDER BY l.grocery_invoice_item_id",id,store).stream().map(Rows::normalize).toList());return Rows.normalize(result);
 }
 @PostMapping @Transactional public Object save(@PathVariable String store,@RequestBody Input in){return persist(store,in,null,null);}
 @PutMapping("/{id}") @Transactional public Object edit(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestBody Input in){return persist(store,in,id,version);}
 private Object persist(String store,Input in,Long editId,String version){access(store);
  a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  if(editId!=null){var existing=a.db.queryForList("SELECT approved_at,xmin::text AS version FROM invoices WHERE invoice_id=? AND dgt_id=? AND invoice_type='GROCERY' FOR UPDATE",editId,store);if(existing.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);if(existing.getFirst().get("approved_at")!=null)throw new ResponseStatusException(HttpStatus.CONFLICT,"Approved invoices cannot be edited");if(!Objects.equals(existing.getFirst().get("version"),version))throw new ResponseStatusException(HttpStatus.CONFLICT,"Invoice changed; reopen it before editing");}
  String number=text(in.invoice(),100),vendor=text(in.vendor(),200);
  LocalDate invoiceDate=in.invoiceDate()==null?in.deliveryDate():in.invoiceDate();
  if(invoiceDate==null||in.lines()==null||in.lines().isEmpty()||in.lines().size()>200)throw bad("Invoice date and 1–200 lines required");
  if(in.dueDate()!=null&&in.dueDate().isBefore(invoiceDate))throw bad("Due date cannot be before the invoice date");
  if(in.deliveryTime()!=null&&in.deliveryDate()==null)throw bad("Enter a delivery date with the delivery time");
  String driverName=optional(in.driverName(),200),driverNumber=optional(in.driverNumber(),100),route=optional(in.routeId(),100),terms=optional(in.terms(),200),notes=optional(in.notes(),4000);
  BigDecimal freight=amount(in.freight()),fuel=amount(in.fuelSurcharge()),handling=amount(in.handlingFee()),discount=amount(in.discount());
  var vendors=a.db.queryForList("SELECT vendor_id FROM vendors WHERE dgt_id=? AND vendor_name=? AND is_active",Long.class,store,vendor);if(vendors.size()!=1)throw bad("Choose an existing active vendor for this store");long vid=vendors.getFirst();
  if(in.purchaseOrderId()!=null){var po=a.db.queryForList("SELECT status FROM purchase_orders WHERE purchase_order_id=? AND dgt_id=? AND vendor_id=? FOR UPDATE",in.purchaseOrderId(),store,vid);if(po.isEmpty())throw bad("Choose a purchase order for this store and vendor");if(!"Approved".equals(po.getFirst().get("status")))throw bad("The purchase order must be approved first");}
  if(!a.db.queryForList("SELECT invoice_id FROM invoices WHERE dgt_id=? AND vendor_id=? AND invoice_number=? AND (?::bigint IS NULL OR invoice_id<>?)",store,vid,number,editId,editId).isEmpty())throw new ResponseStatusException(HttpStatus.CONFLICT,"This vendor invoice already exists; open it instead");
  long id=editId!=null?editId:a.db.queryForObject("INSERT INTO invoices(dgt_id,vendor_id,invoice_number,invoice_type,invoice_date,received_date,received_by) VALUES (?,?,?,'GROCERY',?,?,?) RETURNING invoice_id",Long.class,store,vid,number,invoiceDate,in.deliveryDate(),a.user());
  a.db.update("UPDATE invoices SET purchase_order_id=?,due_date=?,delivery_time=?,driver_name=?,driver_number=?,route_id=?,payment_terms=?,notes=? WHERE invoice_id=?",in.purchaseOrderId(),in.dueDate(),in.deliveryTime(),driverName,driverNumber,route,terms,notes,id);
  var originalNew=new HashSet<Long>();
  if(editId!=null){originalNew.addAll(a.db.queryForList("SELECT product_id FROM grocery_invoice_items WHERE invoice_id=? AND is_product_new",Long.class,id));a.db.update("UPDATE grocery_invoice_items SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND invoice_id=?",id);a.db.update("UPDATE invoices SET vendor_id=?,invoice_number=?,invoice_date=?,received_date=? WHERE invoice_id=?",vid,number,invoiceDate,in.deliveryDate(),id);}
  var seen=new HashSet<String>();
  for(Line l:in.lines()){
   if(l==null)throw bad("Invalid line");String sku=text(l.sku(),100),name=text(l.itemName(),200);if(!seen.add(sku))throw bad("Combine duplicate SKU lines");money(l.unitCost());if(l.msrp()!=null)money(l.msrp());if(l.tax()!=null)money(l.tax());
   if(l.receivedQuantity()!=null&&(l.receivedQuantity().signum()<0||l.receivedQuantity().scale()>3||l.receivedQuantity().compareTo(new BigDecimal("999999999"))>0))throw bad("Received quantity must be nonnegative with at most three decimals");
   if(l.quantity()==null||l.quantity().signum()<=0||l.quantity().scale()>3||l.quantity().compareTo(new BigDecimal("999999999"))>0)throw bad("Quantity must be positive with at most three decimals");
   if(!Set.of("item","case").contains(l.unitType()==null?"":l.unitType()))throw bad("Choose item or case");
   if("case".equals(l.unitType())&&(l.unitsPerCase()==null||l.unitsPerCase()<=0))throw bad("Case pack must be positive");
   String barcode=l.barcode()==null?"":l.barcode().trim();if(barcode.length()>100)throw bad("Barcode too long");
   var ids=a.db.queryForList("SELECT product_id FROM products WHERE dgt_id=? AND product_sku=?",Long.class,store,sku);boolean isNew=ids.isEmpty();long pid;
   if(isNew){
    if(!barcode.isEmpty()&&!a.db.queryForList("SELECT product_id FROM product_barcodes WHERE dgt_id=? AND product_barcode_value=?",store,barcode).isEmpty())throw bad("Barcode belongs to an existing item; use its SKU");
    var subs=a.db.queryForList("SELECT store_sub_department_id FROM store_sub_departments WHERE dgt_id=? AND source_type='UNCLASSIFIED' ORDER BY store_sub_department_id LIMIT 1",Long.class,store);
    long sub;
    if(subs.isEmpty()){
     long dep=a.db.queryForObject("INSERT INTO store_departments(dgt_id,store_department_name,source_type) VALUES (?,'Invoice arrivals','CUSTOM') RETURNING store_department_id",Long.class,store);
     sub=a.db.queryForObject("INSERT INTO store_sub_departments(dgt_id,store_department_id,store_sub_department_name,source_type) VALUES (?,?,'Unclassified','UNCLASSIFIED') RETURNING store_sub_department_id",Long.class,store,dep);
    }else sub=subs.getFirst();
    pid=a.db.queryForObject("INSERT INTO products(dgt_id,store_sub_department_id,product_name,product_sku,purchase_unit,units_per_case,purchase_gross_cost,purchase_discount,is_taxable) VALUES (?,?,?,?,?,?,?,0,COALESCE((SELECT default_tax_type='taxable' FROM grocery_settings WHERE dgt_id=?),true)) RETURNING product_id",Long.class,store,sub,name,sku,l.unitType().toUpperCase(),"case".equals(l.unitType())?l.unitsPerCase():null,l.unitCost(),store);
    if(!barcode.isEmpty())a.db.update("INSERT INTO product_barcodes(dgt_id,product_id,product_barcode_type,product_barcode_value,is_primary) VALUES (?,?,'OTHER',?,true)",store,pid,barcode);
   }else pid=ids.getFirst();
   a.db.update("INSERT INTO grocery_invoice_items(invoice_id,product_id,quantity,unit_type,case_pack_quantity,unit_cost,item_line_total,is_product_new,msrp,received_quantity,line_tax) VALUES (?,?,?,?,?,?,?,?,?,?,?)",id,pid,l.quantity(),l.unitType().toUpperCase(),"case".equals(l.unitType())?l.unitsPerCase():null,l.unitCost(),l.quantity().multiply(l.unitCost()).setScale(2,RoundingMode.HALF_UP),isNew||originalNew.contains(pid),l.msrp(),l.receivedQuantity()==null?l.quantity():l.receivedQuantity(),l.tax()==null?BigDecimal.ZERO:l.tax());
  }
  var sums=a.db.queryForMap("SELECT sum(item_line_total) AS subtotal,sum(line_tax) AS tax FROM grocery_invoice_items WHERE grocery_invoice_items.archived_at IS NULL AND invoice_id=?",id);
  BigDecimal subtotal=(BigDecimal)sums.get("subtotal"),tax=(BigDecimal)sums.get("tax"),charges=freight.add(fuel).add(handling),total=subtotal.add(tax).add(charges).subtract(discount);
  if(discount.compareTo(subtotal.add(charges))>0)throw bad("Discount cannot exceed the subtotal plus additional charges");
  a.db.update("INSERT INTO invoice_charges(invoice_id,charge_type,sub_total,discounted_amount,other_charges,total_amount,status_id,payment_status,freight_amount,fuel_surcharge,handling_fee) VALUES (?,'GROCERY',?,?,?,?,(SELECT status_type_id FROM status_types WHERE status_name='PENDING'),'UNPAID',?,?,?) ON CONFLICT(invoice_id) WHERE charge_type='GROCERY' DO UPDATE SET sub_total=EXCLUDED.sub_total,discounted_amount=EXCLUDED.discounted_amount,other_charges=EXCLUDED.other_charges,total_amount=EXCLUDED.total_amount,freight_amount=EXCLUDED.freight_amount,fuel_surcharge=EXCLUDED.fuel_surcharge,handling_fee=EXCLUDED.handling_fee,updated_at=CURRENT_TIMESTAMP",id,subtotal,discount,charges,total,freight,fuel,handling);
  a.audit(store,editId==null?"INVOICE_ENTERED":"INVOICE_EDITED",Long.toString(id),"{}");return Map.of("id",id,"saved",true);
 }
 @PostMapping("/{id}/approve") @Transactional public Object approve(@PathVariable String store,@PathVariable long id){access(store);
  if(a.required(a.user(),store,"PRICE_BOOK")!=null)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Company admin approval required");
  a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  var invoices=a.db.queryForList("SELECT * FROM invoices WHERE invoice_id=? AND dgt_id=? AND invoice_type='GROCERY' FOR UPDATE",id,store);if(invoices.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  var invoice=invoices.getFirst();if(invoice.get("approved_at")!=null)return Map.of("approved",true);
  var lines=a.db.queryForList("SELECT l.* FROM grocery_invoice_items l JOIN products p ON p.product_id=l.product_id AND p.dgt_id=? WHERE l.archived_at IS NULL AND l.invoice_id=?",store,id);
  if(lines.isEmpty()||lines.size()!=a.db.queryForObject("SELECT count(*) FROM grocery_invoice_items WHERE grocery_invoice_items.archived_at IS NULL AND invoice_id=?",Integer.class,id))throw bad("Invoice contains invalid store items");
  for(var l:lines){
   BigDecimal qty=(BigDecimal)(l.get("received_quantity")==null?l.get("quantity"):l.get("received_quantity")),cost=(BigDecimal)l.get("unit_cost");
   if("CASE".equals(l.get("unit_type"))){BigDecimal pack=(BigDecimal)l.get("case_pack_quantity");if(pack==null||pack.signum()<=0)throw bad("Invalid case pack");qty=qty.multiply(pack);cost=cost.divide(pack,2,RoundingMode.HALF_UP);}else if(!"ITEM".equals(l.get("unit_type")))throw bad("Invalid unit");
   if(qty.signum()>0){
    long movement=a.db.queryForObject("INSERT INTO inventory_movements(dgt_id,product_id,movement_type,qty_changed,unit_cost,reference_id) VALUES (?,?,'PURCHASE',?,?,?) RETURNING movement_id",Long.class,store,l.get("product_id"),qty,cost,id);
    a.db.update("INSERT INTO inventory(dgt_id,product_id,available_quantity) SELECT dgt_id,product_id,qty_changed FROM inventory_movements WHERE movement_id=? ON CONFLICT(dgt_id,product_id) DO UPDATE SET available_quantity=inventory.available_quantity+EXCLUDED.available_quantity,updated_at=CURRENT_TIMESTAMP",movement);
   }
   if(Boolean.TRUE.equals(l.get("is_product_new")))a.db.update("INSERT INTO product_vendors(dgt_id,product_id,vendor_id,unit_type,unit_cost) VALUES (?,?,?,'ITEM',?) ON CONFLICT(product_id,vendor_id) DO UPDATE SET archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE product_vendors.archived_at IS NOT NULL",store,l.get("product_id"),invoice.get("vendor_id"),cost);
  }
  a.db.update("UPDATE invoice_charges SET status_id=(SELECT status_type_id FROM status_types WHERE status_name='APPROVED'),updated_at=CURRENT_TIMESTAMP WHERE invoice_id=? AND charge_type='GROCERY'",id);
  a.db.update("UPDATE invoices SET approved_at=CURRENT_TIMESTAMP,approved_by=? WHERE invoice_id=?",a.user(),id);a.audit(store,"INVOICE_APPROVED",Long.toString(id),"{}");return Map.of("approved",true);
 }
}
