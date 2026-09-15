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
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/reductions")
public class StoreReductionController {
 private final ScopedAccess a;
 public StoreReductionController(ScopedAccess a){this.a=a;}
 private static final Set<String> REASONS=Set.of("damaged-returnable","expired-returnable","vendor-recall","damaged-non-returnable","expired-non-returnable","theft","spoilage","counting-error","store-to-store-transfer");
 private boolean allowed(String store,String code,boolean manager){
  long uid=a.user();if(a.admin(uid,a.company(store)))return true;
  return !a.db.queryForList("SELECT ur.user_role_id FROM user_roles ur JOIN role_types rt USING(role_type_id) JOIN store_role_permissions rp ON rp.dgt_id=ur.dgt_id AND rp.role_type_id=ur.role_type_id WHERE ur.user_id=? AND ur.dgt_id=? AND ur.is_active AND rt.is_active AND rp.permission_code=? AND rp.allowed AND (?=false OR upper(rt.role_type_name)='MANAGER')",uid,store,code,manager).isEmpty();
 }
 private void require(String store,String code,boolean manager){if(!allowed(store,code,manager))throw a.denied();}
 private RuntimeException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 public record Input(long productId,BigDecimal quantity,String reason,String destination){}
 public record Decision(String status,String note){}
 private String route(String reason){return switch(reason){case "store-to-store-transfer"->"transfers";case "damaged-returnable","expired-returnable"->"returnable";case "damaged-non-returnable","expired-non-returnable"->"non-returnable";default->"shrinkage";};}
 @GetMapping public Object list(@PathVariable String store){require(store,"GROCERY_VIEW_INVENTORY",false);
  var rows=a.db.queryForList("SELECT r.*,p.product_name,p.product_sku,(SELECT b.product_barcode_value FROM product_barcodes b WHERE b.archived_at IS NULL AND b.product_id=p.product_id AND b.dgt_id=p.dgt_id ORDER BY b.is_primary DESC,b.product_barcode_id LIMIT 1) AS barcode,(SELECT m.unit_cost FROM inventory_movements m WHERE m.dgt_id=r.dgt_id AND m.product_id=r.product_id AND m.reference_id=r.reduction_request_id AND m.movement_type='ADJUSTMENT' ORDER BY m.movement_id DESC LIMIT 1) AS recorded_unit_cost,(SELECT round(-m.qty_changed*m.unit_cost,2) FROM inventory_movements m WHERE m.dgt_id=r.dgt_id AND m.product_id=r.product_id AND m.reference_id=r.reduction_request_id AND m.movement_type='ADJUSTMENT' ORDER BY m.movement_id DESC LIMIT 1) AS recorded_loss,s.store_name AS destination_name FROM inventory_reduction_requests r JOIN products p ON p.product_id=r.product_id AND p.dgt_id=r.dgt_id LEFT JOIN stores s ON s.dgt_id=r.destination WHERE r.dgt_id=? ORDER BY r.reduction_request_id DESC",store);
  boolean reviewer=allowed(store,"GROCERY_ADJUST_STOCK",true);long uid=a.user();
  for(var row:rows){row.put("route",route((String)row.get("reason")));row.put("canReview",reviewer&&(a.admin(uid,a.company(store))||uid!=((Number)row.get("requested_by")).longValue())&&"PENDING".equals(row.get("status")));}
  var items=a.db.queryForList("SELECT p.product_id AS id,p.product_name AS \"itemName\",p.product_sku AS \"scanCode\",d.store_department_name AS department,i.available_quantity AS \"inventoryCount\",p.is_taxable AS taxable,p.purchase_gross_cost,p.purchase_discount,p.purchase_unit,p.units_per_case,"+ItemSellingPrice.SQL+" AS price,COALESCE((SELECT string_agg(v.vendor_name,', ') FROM product_vendors pv JOIN vendors v ON v.vendor_id=pv.vendor_id AND v.dgt_id=pv.dgt_id WHERE pv.archived_at IS NULL AND pv.product_id=p.product_id AND pv.dgt_id=p.dgt_id),'') AS vendor FROM products p JOIN inventory i ON i.product_id=p.product_id AND i.dgt_id=p.dgt_id JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id LEFT JOIN product_store_prices pr ON pr.product_id=p.product_id AND pr.dgt_id=p.dgt_id WHERE p.dgt_id=? ORDER BY p.product_name",store);
  for(var item:items)item.put("netCost",cost(item));
  return Map.of("requests",rows.stream().map(Rows::normalize).toList(),"items",items.stream().map(Rows::normalize).toList(),"canSubmit",allowed(store,"GROCERY_REDUCE_STOCK",false),"stores",a.stores().stream().filter(s->!store.equals(s.get("dgt_id"))).map(Rows::normalize).toList());
 }
 private BigDecimal cost(Map<String,Object> p){BigDecimal g=(BigDecimal)p.get("purchase_gross_cost"),d=(BigDecimal)p.get("purchase_discount");if(g==null||d==null)return null;BigDecimal divisor=BigDecimal.ONE;if("CASE".equals(p.get("purchase_unit"))){Number n=(Number)p.get("units_per_case");if(n==null||n.intValue()<=0)return null;divisor=BigDecimal.valueOf(n.intValue());}return g.subtract(d).divide(divisor,2,RoundingMode.HALF_UP);}
 @PostMapping("/batch") @Transactional public Object batch(@PathVariable String store,@RequestBody List<Input> inputs){if(inputs==null||inputs.isEmpty()||inputs.size()>200)throw bad("Choose 1–200 items");return inputs.stream().map(i->submit(store,i,UUID.randomUUID())).toList();}
 @PostMapping @Transactional public Object submit(@PathVariable String store,@RequestBody Input in,@RequestHeader("Idempotency-Key") UUID key){require(store,"GROCERY_REDUCE_STOCK",false);
  a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  if(!a.db.queryForList("SELECT reduction_request_id FROM inventory_reduction_requests WHERE dgt_id=? AND product_id=? AND requested_by=? AND status='PENDING'",store,in.productId(),a.user()).isEmpty())throw new ResponseStatusException(HttpStatus.CONFLICT,"You already have a pending reduction for this item");
  if(in.reason()==null||!REASONS.contains(in.reason())||in.quantity()==null||in.quantity().signum()<=0||in.quantity().scale()>3)throw bad("Enter a positive reduction and valid reason");
  if("store-to-store-transfer".equals(in.reason())){if(store.equals(in.destination())||a.stores().stream().noneMatch(s->Objects.equals(s.get("dgt_id"),in.destination())))throw bad("Choose an accessible destination store");}else if(in.destination()!=null)throw bad("Destination is only for transfers");
  var qty=a.db.queryForList("SELECT available_quantity FROM inventory WHERE dgt_id=? AND product_id=? FOR UPDATE",BigDecimal.class,store,in.productId());if(qty.isEmpty()||qty.getFirst().compareTo(in.quantity())<0)throw bad("Reduction exceeds current stock");
  long id=a.db.queryForObject("INSERT INTO inventory_reduction_requests(dgt_id,product_id,requested_by,quantity,reason,destination,request_type) VALUES (?,?,?,?,?,?,?) RETURNING reduction_request_id",Long.class,store,in.productId(),a.user(),in.quantity(),in.reason(),in.destination(),route(in.reason()));
  a.audit(store,"REDUCTION_REQUESTED",Long.toString(id),"{}");
  boolean autoApprove=a.admin(a.user(),a.company(store));if(autoApprove)decide(store,id,new Decision("APPROVED",null));
  return Map.of("id",id,"pending",!autoApprove);
 }
 @PostMapping("/{id}/decision") @Transactional public Object decide(@PathVariable String store,@PathVariable long id,@RequestBody Decision decision){require(store,"GROCERY_ADJUST_STOCK",true);
  if(decision.note()!=null&&decision.note().length()>255)throw bad("Decision note must be at most 255 characters");
  if(!Set.of("APPROVED","REJECTED").contains(decision.status()==null?"":decision.status()))throw bad("Choose approve or reject");
  a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  var rows=a.db.queryForList("SELECT * FROM inventory_reduction_requests WHERE reduction_request_id=? AND dgt_id=? FOR UPDATE",id,store);if(rows.isEmpty())throw a.denied();var r=rows.getFirst();if(((Number)r.get("requested_by")).longValue()==a.user()&&!a.admin(a.user(),a.company(store)))throw a.denied();
  if(!"PENDING".equals(r.get("status")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Request already decided");
  if("APPROVED".equals(decision.status())){
   var quantity=(BigDecimal)r.get("quantity");long pid=((Number)r.get("product_id")).longValue();
   var p=a.db.queryForMap("SELECT * FROM products WHERE product_id=? AND dgt_id=?",pid,store);var unitCost=cost(p);if(unitCost==null)throw bad("Set this item's cost before approving");
   // The recorded movement supplies the balance delta. Both writes and the
   // request decision commit together; any stock conflict rolls everything back.
   long movementId=a.db.queryForObject("INSERT INTO inventory_movements(dgt_id,product_id,movement_type,qty_changed,unit_cost,reference_id) VALUES (?,?,'ADJUSTMENT',?,?,?) RETURNING movement_id",Long.class,store,pid,quantity.negate(),unitCost,id);
   if(a.db.update("UPDATE inventory i SET available_quantity=i.available_quantity+m.qty_changed,updated_at=CURRENT_TIMESTAMP FROM inventory_movements m WHERE m.movement_id=? AND i.product_id=m.product_id AND i.dgt_id=m.dgt_id AND i.available_quantity+m.qty_changed>=0",movementId)!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Stock changed; not enough units remain");
  }
  if("APPROVED".equals(decision.status())&&"transfers".equals(r.get("request_type")))ensureTransfer(r);
  a.db.update("UPDATE inventory_reduction_requests SET status=?,rejection_reason=?,updated_at=CURRENT_TIMESTAMP WHERE reduction_request_id=?",decision.status(),decision.note(),id);a.audit(store,"REDUCTION_"+decision.status(),Long.toString(id),"{}");return Map.of("status",decision.status());
 }


 @GetMapping("/return-slips") public Object slips(@PathVariable String store){require(store,"GROCERY_VIEW_INVENTORY",false);
  var rows=a.db.queryForList("SELECT r.*,v.vendor_name,q.reason AS adjustment_reason FROM inventory_returns r JOIN vendors v ON v.vendor_id=r.vendor_id AND v.dgt_id=r.dgt_id JOIN inventory_reduction_requests q ON q.reduction_request_id=r.reduction_request_id AND q.dgt_id=r.dgt_id WHERE r.dgt_id=? ORDER BY r.return_id DESC",store);
  for(var r:rows)r.put("items",a.db.queryForList("SELECT i.*,p.product_name,p.product_sku FROM inventory_return_items i JOIN products p ON p.product_id=i.product_id AND p.dgt_id=? WHERE i.return_id=?",store,r.get("return_id")));
  return Map.of("returns",rows.stream().map(Rows::normalize).toList(),"vendors",a.db.queryForList("SELECT vendor_id,vendor_name FROM vendors WHERE dgt_id=? ORDER BY vendor_name",store),"canManage",allowed(store,"GROCERY_ADJUST_STOCK",true));
 }
 public record Slip(long requestId,long vendorId,String reason,String method,String reference){}
 @PostMapping("/return-slips") @Transactional public Object createSlip(@PathVariable String store,@RequestBody Slip in){require(store,"GROCERY_ADJUST_STOCK",true);
  if(in.reason()==null||in.reason().isBlank()||in.reason().length()>255||in.method()==null||!Set.of("Pickup","Drop-off","Credit without return").contains(in.method())||in.reference()!=null&&in.reference().length()>100)throw bad("Enter a reason, return method and reference of at most 100 characters");
  var rows=a.db.queryForList("SELECT * FROM inventory_reduction_requests WHERE reduction_request_id=? AND dgt_id=? FOR UPDATE",in.requestId(),store);if(rows.isEmpty())throw a.denied();var r=rows.getFirst();
  if(!"APPROVED".equals(r.get("status"))||!"returnable".equals(r.get("request_type")))throw bad("Select an approved returnable item");
  if(a.db.queryForList("SELECT vendor_id FROM vendors WHERE vendor_id=? AND dgt_id=?",in.vendorId(),store).isEmpty())throw bad("Select this store's vendor");
  if(!a.db.queryForList("SELECT return_id FROM inventory_returns WHERE reduction_request_id=?",in.requestId()).isEmpty())throw new ResponseStatusException(HttpStatus.CONFLICT,"Return slip already exists; open it in Return Status Tracking");
  BigDecimal cost=a.db.queryForObject("SELECT unit_cost FROM inventory_movements WHERE dgt_id=? AND product_id=? AND reference_id=? AND movement_type='ADJUSTMENT' ORDER BY movement_id DESC LIMIT 1",BigDecimal.class,store,r.get("product_id"),in.requestId());
  long id=a.db.queryForObject("INSERT INTO inventory_returns(dgt_id,vendor_id,return_type,reference_number,status,reduction_request_id) VALUES (?,?,?,?,'DRAFT',?) RETURNING return_id",Long.class,store,in.vendorId(),in.method(),in.reference(),in.requestId());
  a.db.update("INSERT INTO inventory_return_items(return_id,product_id,qty,unit_cost,reason) VALUES (?,?,?,?,?)",id,r.get("product_id"),r.get("quantity"),cost,in.reason());a.audit(store,"RETURN_SLIP_CREATED",Long.toString(id),"{}");return Map.of("id",id);
 }
 public record ReturnState(String status){}
 @PostMapping("/return-slips/{id}/status") @Transactional public Object returnState(@PathVariable String store,@PathVariable long id,@RequestBody ReturnState in){require(store,"GROCERY_ADJUST_STOCK",true);
  var rows=a.db.queryForList("SELECT status FROM inventory_returns WHERE return_id=? AND dgt_id=? AND reduction_request_id IS NOT NULL FOR UPDATE",id,store);if(rows.isEmpty())throw a.denied();String old=(String)rows.getFirst().get("status");
  var next=switch(old){case "DRAFT"->Set.of("PENDING");case "PENDING"->Set.of("SENT","CREDIT_RECEIVED");case "SENT"->Set.of("CREDIT_RECEIVED");case "CREDIT_RECEIVED"->Set.of("CLOSED");default->Set.<String>of();};
  if(in.status()==null||!next.contains(in.status()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Invalid or already completed status change");
  a.db.update("UPDATE inventory_returns SET status=?,updated_at=CURRENT_TIMESTAMP,settled_at=CASE WHEN ?='CREDIT_RECEIVED' THEN CURRENT_TIMESTAMP ELSE settled_at END,settled_by=CASE WHEN ?='CREDIT_RECEIVED' THEN ? ELSE settled_by END WHERE return_id=?",in.status(),in.status(),in.status(),a.user(),id);a.audit(store,"RETURN_STATUS_"+in.status(),Long.toString(id),"{}");return Map.of("status",in.status());
 }

 private long ensureTransfer(Map<String,Object> r){
  var existing=a.db.queryForList("SELECT transfer_id FROM inventory_transfers WHERE reduction_request_id=?",Long.class,r.get("reduction_request_id"));if(!existing.isEmpty())return existing.getFirst();
  BigDecimal cost=a.db.queryForObject("SELECT unit_cost FROM inventory_movements WHERE dgt_id=? AND product_id=? AND movement_type='ADJUSTMENT' AND reference_id=? ORDER BY movement_id DESC LIMIT 1",BigDecimal.class,r.get("dgt_id"),r.get("product_id"),r.get("reduction_request_id"));
  long tid=a.db.queryForObject("INSERT INTO inventory_transfers(from_dgt_id,to_dgt_id,status,created_by,reduction_request_id) VALUES (?,?,'IN_TRANSIT',?,?) RETURNING transfer_id",Long.class,r.get("dgt_id"),r.get("destination"),a.user(),r.get("reduction_request_id"));
  a.db.update("INSERT INTO inventory_transfer_items(transfer_id,product_id,qty_sent,unit_cost) VALUES (?,?,?,?)",tid,r.get("product_id"),r.get("quantity"),cost);return tid;
 }
 @GetMapping("/transfers") public Object transfers(@PathVariable String store){require(store,"GROCERY_VIEW_INVENTORY",false);
  var rows=a.db.queryForList("SELECT r.reduction_request_id,r.dgt_id,r.destination,r.quantity,r.updated_at,p.product_name,p.product_sku,COALESCE(i.qty_received,0) AS qty_received,i.destination_product_id,COALESCE(t.status,'IN_TRANSIT') AS transfer_status FROM inventory_reduction_requests r JOIN products p ON p.product_id=r.product_id AND p.dgt_id=r.dgt_id LEFT JOIN inventory_transfers t ON t.reduction_request_id=r.reduction_request_id LEFT JOIN inventory_transfer_items i ON i.transfer_id=t.transfer_id AND i.product_id=r.product_id WHERE r.status='APPROVED' AND r.request_type='transfers' AND (r.dgt_id=? OR r.destination=?) ORDER BY r.reduction_request_id DESC",store,store);
  return Map.of("transfers",rows.stream().map(Rows::normalize).toList(),"items",a.db.queryForList("SELECT product_id,product_name,product_sku FROM products WHERE dgt_id=? ORDER BY product_name",store),"canReceive",allowed(store,"GROCERY_ADJUST_STOCK",true));
 }
 public record TransferReceipt(long productId,BigDecimal totalReceived){}
 @PostMapping("/transfers/{id}/receive") @Transactional public Object receiveTransfer(@PathVariable String store,@PathVariable long id,@RequestBody TransferReceipt in){require(store,"GROCERY_ADJUST_STOCK",true);
  var rows=a.db.queryForList("SELECT * FROM inventory_reduction_requests WHERE reduction_request_id=? AND destination=? AND request_type='transfers' AND status='APPROVED' FOR UPDATE",id,store);if(rows.isEmpty())throw a.denied();long tid=ensureTransfer(rows.getFirst());
  var r=a.db.queryForMap("SELECT * FROM inventory_transfer_items WHERE transfer_id=? FOR UPDATE",tid);
  BigDecimal old=(BigDecimal)r.get("qty_received"),sent=(BigDecimal)r.get("qty_sent");
  if(in.totalReceived()==null||in.totalReceived().scale()>3||in.totalReceived().compareTo(old)<=0||in.totalReceived().compareTo(sent)>0)throw new ResponseStatusException(HttpStatus.CONFLICT,"Total received must exceed the previous receipt and cannot exceed sent quantity");
  if(a.db.queryForList("SELECT product_id FROM products WHERE product_id=? AND dgt_id=?",in.productId(),store).isEmpty())throw bad("Choose this store's matching item");
  if(r.get("destination_product_id")!=null&&((Number)r.get("destination_product_id")).longValue()!=in.productId())throw bad("Keep the item used in the first receipt");
  long mid=a.db.queryForObject("INSERT INTO inventory_movements(dgt_id,product_id,movement_type,qty_changed,unit_cost,reference_id) VALUES (?,?,'TRANSFER_IN',?,?,?) RETURNING movement_id",Long.class,store,in.productId(),in.totalReceived().subtract(old),r.get("unit_cost"),tid);
  a.db.update("INSERT INTO inventory(dgt_id,product_id,available_quantity) SELECT dgt_id,product_id,qty_changed FROM inventory_movements WHERE movement_id=? ON CONFLICT(dgt_id,product_id) DO UPDATE SET available_quantity=inventory.available_quantity+EXCLUDED.available_quantity,updated_at=CURRENT_TIMESTAMP",mid);
  a.db.update("UPDATE inventory_transfer_items SET qty_received=?,destination_product_id=? WHERE transfer_item_id=?",in.totalReceived(),in.productId(),r.get("transfer_item_id"));String status=in.totalReceived().compareTo(sent)==0?"COMPLETED":"PARTIAL";
  a.db.update("UPDATE inventory_transfers SET status=?,updated_at=CURRENT_TIMESTAMP WHERE transfer_id=?",status,tid);a.audit(store,"TRANSFER_RECEIVED",Long.toString(tid),"{}");return Map.of("status",status);
 }
}
