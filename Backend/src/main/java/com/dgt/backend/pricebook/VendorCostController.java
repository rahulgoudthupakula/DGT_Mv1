package com.dgt.backend.pricebook;

import java.math.*;
import java.util.*;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/vendors/pricing")
public class VendorCostController {
 private final ScopedAccess a;
 public VendorCostController(ScopedAccess a){this.a=a;}
 private void access(String store){a.grant(a.user(),store,"PRICE_BOOK",true);}
 private void lock(String store){access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);access(store);}
 public record Cost(BigDecimal cost){}
 @GetMapping("/items") public Object items(@PathVariable String store){access(store);return a.db.queryForList("SELECT pv.product_vendor_id AS id,p.product_name AS item,v.vendor_name AS vendor,pv.unit_cost AS cost,pv.unit_type AS unit,pv.xmin::text AS version FROM product_vendors pv JOIN products p ON p.product_id=pv.product_id AND p.dgt_id=pv.dgt_id JOIN vendors v ON v.vendor_id=pv.vendor_id AND v.dgt_id=pv.dgt_id WHERE pv.archived_at IS NULL AND pv.dgt_id=? ORDER BY p.product_name,v.vendor_name",store).stream().map(Rows::normalize).toList();}
 @PutMapping("/items/{id}/cost") @Transactional public Object change(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestBody Cost input){
  lock(store);BigDecimal cost=input.cost();if(cost==null||cost.signum()<0||cost.scale()>2||cost.compareTo(new BigDecimal("99999999.99"))>0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Enter a non-negative cost with at most two decimals");
  var rows=a.db.queryForList("SELECT pv.*,pv.xmin::text AS version FROM product_vendors pv JOIN products p ON p.product_id=pv.product_id AND p.dgt_id=pv.dgt_id JOIN vendors v ON v.vendor_id=pv.vendor_id AND v.dgt_id=pv.dgt_id WHERE pv.archived_at IS NULL AND pv.dgt_id=? AND pv.product_vendor_id=? FOR UPDATE OF pv",store,id);
  if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Linked item not found in this store");
  var row=rows.getFirst();if(!Objects.equals(version,row.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Cost changed; reload and retry");
  BigDecimal old=(BigDecimal)row.get("unit_cost");if(old.compareTo(cost)==0)return Map.of("changed",false);
  a.db.update("UPDATE product_vendors SET unit_cost=?,updated_at=CURRENT_TIMESTAMP WHERE product_vendor_id=?",cost,id);
  record(store,((Number)row.get("product_id")).longValue(),((Number)row.get("vendor_id")).longValue(),old,cost,"MANUAL:"+row.get("unit_type"),a.user(),a.db.queryForObject("SELECT (CURRENT_TIMESTAMP AT TIME ZONE COALESCE(timezone,'UTC'))::date FROM stores WHERE dgt_id=?",java.sql.Date.class,store));
  return Map.of("changed",true);
 }
 void record(String store,long product,long vendor,BigDecimal old,BigDecimal cost,String source,Object actor,Object date){
  BigDecimal percent=old.signum()==0?null:cost.subtract(old).multiply(new BigDecimal("100")).divide(old,2,RoundingMode.HALF_UP);
  if(percent!=null&&percent.abs().compareTo(new BigDecimal("99999999.99"))>0)percent=null;
  long history=a.db.queryForObject("INSERT INTO vendor_item_cost_history(product_id,vendor_id,old_cost,new_cost,change_percentage,effective_date,change_source,changed_by) VALUES (?,?,?,?,?,?,?,?) RETURNING cost_history_id",Long.class,product,vendor,old,cost,percent,date,source,actor);
  a.db.update("INSERT INTO vendor_audit_log(vendor_id,product_id,dgt_id,action_type,details,cost_history_id) VALUES (?,?,?,?,?,?)",vendor,product,store,"COST_CHANGED",source+": "+old+" → "+cost,history);
 }
 // Approved invoice lines only. The source key makes repeated scans idempotent under the store lock.
 // Invoice comparisons never mutate the current vendor cost or create vendor links.
 @PostMapping("/invoice-costs") @Transactional public Object invoices(@PathVariable String store){
  lock(store);
  var lines=a.db.queryForList("SELECT gi.*,i.vendor_id,i.invoice_date,i.approved_by FROM grocery_invoice_items gi JOIN invoices i ON i.invoice_id=gi.invoice_id JOIN products p ON p.product_id=gi.product_id AND p.dgt_id=i.dgt_id JOIN vendors v ON v.vendor_id=i.vendor_id AND v.dgt_id=i.dgt_id WHERE gi.archived_at IS NULL AND i.dgt_id=? AND i.approved_at IS NOT NULL AND i.invoice_type='GROCERY' ORDER BY i.invoice_date,i.invoice_id,gi.grocery_invoice_item_id",store);
  Map<String,Map<String,Object>> prior=new HashMap<>();int added=0;
  // Conflicting prices for the same invoice/item/unit cannot provide an unambiguous baseline.
  Map<String,Set<BigDecimal>> invoiceCosts=new HashMap<>();
  for(var l:lines){String k=l.get("invoice_id")+":"+l.get("product_id")+":"+l.get("unit_type")+":"+l.get("case_pack_quantity");invoiceCosts.computeIfAbsent(k,x->new HashSet<>()).add(((BigDecimal)l.get("unit_cost")).stripTrailingZeros());}
  for(var line:lines){
   String unit=String.valueOf(line.get("unit_type")).toUpperCase(Locale.ROOT);Object pack=line.get("case_pack_quantity");
   if(!Set.of("ITEM","CASE").contains(unit)||"CASE".equals(unit)&&(pack==null||((BigDecimal)pack).signum()<=0))continue;
   String key=line.get("vendor_id")+":"+line.get("product_id")+":"+unit+":"+("CASE".equals(unit)?((BigDecimal)pack).stripTrailingZeros().toPlainString():"1");
   String invoiceKey=line.get("invoice_id")+":"+line.get("product_id")+":"+line.get("unit_type")+":"+line.get("case_pack_quantity");
   if(invoiceCosts.get(invoiceKey).size()>1){prior.remove(key);continue;}
   var previous=prior.get(key);
   // Multiple lines in one invoice are not comparisons against a previous invoice.
   if(previous!=null&&!previous.get("invoice_id").equals(line.get("invoice_id"))){
    BigDecimal old=(BigDecimal)previous.get("unit_cost"),cost=(BigDecimal)line.get("unit_cost");
    String source="INVOICE:"+line.get("grocery_invoice_item_id")+":"+previous.get("grocery_invoice_item_id");
    if(old.compareTo(cost)!=0&&!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM vendor_item_cost_history WHERE product_id=? AND vendor_id=? AND split_part(change_source,':',2)=? AND change_source LIKE 'INVOICE:%')",Boolean.class,line.get("product_id"),line.get("vendor_id"),line.get("grocery_invoice_item_id").toString()))){
     record(store,((Number)line.get("product_id")).longValue(),((Number)line.get("vendor_id")).longValue(),old,cost,source,line.get("approved_by"),line.get("invoice_date"));added++;
    }
   }
   prior.put(key,line);
  }
  return Map.of("recorded",added);
 }
}
