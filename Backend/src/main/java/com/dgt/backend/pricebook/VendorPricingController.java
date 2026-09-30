package com.dgt.backend.pricebook;

import java.util.*;
import java.math.BigDecimal;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import tools.jackson.databind.ObjectMapper;
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
public class VendorPricingController {
 private final ScopedAccess a;private final ObjectMapper json;
 public VendorPricingController(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 public record Preferences(boolean priceChangeAlerts,BigDecimal alertThreshold,boolean approvalRequired,BigDecimal approvalThreshold,boolean autoPick,boolean fallback,boolean considerLeadTime){}
 private void access(String store){a.grant(a.user(),store,"PRICE_BOOK",true);}
 private ResponseStatusException conflict(){return new ResponseStatusException(HttpStatus.CONFLICT,"Pricing preferences changed or have duplicate records; reload and retry");}
 @GetMapping("/pricing") public Object pricing(@PathVariable String store){access(store);
  var rows=a.db.queryForList("SELECT price_change_alert_enabled AS \"priceChangeAlerts\",alert_threshold_percentage AS \"alertThreshold\",approval_required AS \"approvalRequired\",approval_threshold_percentage AS \"approvalThreshold\",auto_pick_preferred_vendor AS \"autoPick\",use_fallback_vendor AS fallback,consider_lead_time AS \"considerLeadTime\",xmin::text AS version FROM vendor_price_settings WHERE dgt_id=?",store);
  if(rows.size()>1)throw conflict();
  Object settings=rows.isEmpty()?Map.of("priceChangeAlerts",false,"approvalRequired",false,"autoPick",false,"fallback",false,"considerLeadTime",false,"version","0"):Rows.normalize(rows.getFirst());
  var history=a.db.queryForList("SELECT h.cost_history_id::text AS id,p.product_name AS item,v.vendor_name AS vendor,h.old_cost AS \"oldCost\",h.new_cost AS \"newCost\",h.change_percentage AS change,h.effective_date AS \"effectiveDate\",u.email AS \"changedBy\",h.change_source AS source,h.new_cost-h.old_cost AS difference,h.created_date AS timestamp,ci.invoice_number AS \"invoiceNumber\",pi.invoice_number AS \"previousInvoice\",pi.invoice_date AS \"previousInvoiceDate\",cl.unit_type AS unit,cl.case_pack_quantity AS \"casePack\" FROM vendor_item_cost_history h JOIN products p ON p.product_id=h.product_id JOIN vendors v ON v.vendor_id=h.vendor_id AND v.dgt_id=p.dgt_id LEFT JOIN users u ON u.user_id=h.changed_by LEFT JOIN grocery_invoice_items cl ON cl.archived_at IS NULL AND cl.grocery_invoice_item_id::text=split_part(h.change_source,':',2) AND h.change_source LIKE 'INVOICE:%' AND cl.product_id=h.product_id LEFT JOIN invoices ci ON ci.invoice_id=cl.invoice_id AND ci.dgt_id=p.dgt_id AND ci.vendor_id=h.vendor_id LEFT JOIN grocery_invoice_items pl ON pl.archived_at IS NULL AND pl.grocery_invoice_item_id::text=split_part(h.change_source,':',3) AND pl.product_id=h.product_id LEFT JOIN invoices pi ON pi.invoice_id=pl.invoice_id AND pi.dgt_id=p.dgt_id AND pi.vendor_id=h.vendor_id WHERE p.dgt_id=? UNION ALL SELECT 'catalog-'||e.event_id,p.product_name,'Catalog cost',(e.changes->>'oldCost')::numeric,(e.changes->>'newCost')::numeric,(e.changes->>'change')::numeric,(e.created_at AT TIME ZONE COALESCE(s.timezone,'UTC'))::date,u.email,'MANUAL:CATALOG',(e.changes->>'newCost')::numeric-(e.changes->>'oldCost')::numeric,e.created_at,NULL,NULL,NULL,'ITEM',NULL FROM access_audit_events e JOIN products p ON p.product_id::text=e.target_id AND p.dgt_id=e.dgt_id JOIN stores s ON s.dgt_id=e.dgt_id AND s.company_id=e.company_id LEFT JOIN users u ON u.user_id=e.actor_user_id WHERE e.dgt_id=? AND e.event_type='ITEM_CATALOG_COST_CHANGED' ORDER BY timestamp DESC,id DESC LIMIT 200",store,store);
  return Map.of("settings",settings,"configured",!rows.isEmpty(),"history",history.stream().map(Rows::normalize).toList());
 }
 @PutMapping("/pricing") @Transactional public Object save(@PathVariable String store,@RequestHeader("If-Match") String version,@RequestBody Preferences p){access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);access(store);
  var versions=a.db.queryForList("SELECT xmin::text FROM vendor_price_settings WHERE dgt_id=?",String.class,store);
  if(versions.size()>1||!Objects.equals(version,versions.isEmpty()?"0":versions.getFirst()))throw conflict();
  for(BigDecimal n:Arrays.asList(p.alertThreshold(),p.approvalThreshold()))if(n!=null&&(n.signum()<0||n.scale()>2||n.compareTo(new BigDecimal("99999999.99"))>0))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thresholds must be non-negative percentages with at most two decimals");
  if(p.priceChangeAlerts()&&p.alertThreshold()==null||p.approvalRequired()&&p.approvalThreshold()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Enter a threshold for each enabled control");
  if(versions.isEmpty())a.db.update("INSERT INTO vendor_price_settings(dgt_id,price_change_alert_enabled,alert_threshold_percentage,approval_required,approval_threshold_percentage,auto_pick_preferred_vendor,use_fallback_vendor,consider_lead_time) VALUES (?,?,?,?,?,?,?,?)",store,p.priceChangeAlerts(),p.alertThreshold(),p.approvalRequired(),p.approvalThreshold(),p.autoPick(),p.fallback(),p.considerLeadTime());
  else a.db.update("UPDATE vendor_price_settings SET price_change_alert_enabled=?,alert_threshold_percentage=?,approval_required=?,approval_threshold_percentage=?,auto_pick_preferred_vendor=?,use_fallback_vendor=?,consider_lead_time=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=?",p.priceChangeAlerts(),p.alertThreshold(),p.approvalRequired(),p.approvalThreshold(),p.autoPick(),p.fallback(),p.considerLeadTime(),store);
  a.audit(store,"VENDOR_PRICING_PREFERENCES_UPDATED",store,json.writeValueAsString(p));return pricing(store);
 }
 @GetMapping("/audit") public Object audit(@PathVariable String store){access(store);
  var rows=a.db.queryForList("SELECT * FROM (SELECT 'access-'||e.event_id AS id,e.event_type AS action,CASE WHEN e.event_type='VENDOR_PRICING_PREFERENCES_UPDATED' THEN e.changes::text ELSE 'Record '||COALESCE(e.target_id,'') END AS details,u.email AS actor,e.created_at AS timestamp FROM access_audit_events e LEFT JOIN users u ON u.user_id=e.actor_user_id WHERE e.dgt_id=? AND e.company_id=? AND e.event_type LIKE 'VENDOR_%' UNION ALL SELECT 'vendor-'||l.audit_id,l.action_type,l.details,u.email,l.created_at FROM vendor_audit_log l JOIN vendors v ON v.vendor_id=l.vendor_id AND v.dgt_id=l.dgt_id LEFT JOIN vendor_item_cost_history h ON h.cost_history_id=l.cost_history_id AND h.vendor_id=l.vendor_id LEFT JOIN users u ON u.user_id=h.changed_by WHERE l.dgt_id=?) events ORDER BY timestamp DESC,id DESC LIMIT 200",store,a.company(store),store);
  return rows.stream().map(Rows::normalize).toList();
 }
}
