package com.dgt.backend.pricebook;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/new-arrivals")
public class StoreNewArrivalsController {
 private final ScopedAccess a;
 public StoreNewArrivalsController(ScopedAccess a){this.a=a;}
 @GetMapping public Object list(@PathVariable String store){
  a.grant(a.user(),store,"PRICE_BOOK",false);
  var rows=a.db.queryForList("""
   SELECT DISTINCT ON (p.product_id) p.product_id AS id,l.msrp,
    v.vendor_name AS vendor,COALESCE(i.received_date,i.invoice_date) AS "firstReceived",
    CASE WHEN upper(l.unit_type) IN ('ITEM','UNIT') THEN COALESCE(l.received_quantity,l.quantity)
         WHEN upper(l.unit_type)='CASE' AND l.case_pack_quantity>0 THEN COALESCE(l.received_quantity,l.quantity)*l.case_pack_quantity END AS "unitsReceived",
    CASE WHEN upper(l.unit_type) IN ('ITEM','UNIT') THEN l.unit_cost
         WHEN upper(l.unit_type)='CASE' AND l.case_pack_quantity>0 THEN l.unit_cost/l.case_pack_quantity END AS cost,
    s.source_type='UNCLASSIFIED' AS "needsCategory",
    COALESCE(i.received_date,i.invoice_date) BETWEEN (CURRENT_TIMESTAMP AT TIME ZONE st.timezone)::date-6 AND (CURRENT_TIMESTAMP AT TIME ZONE st.timezone)::date AS "isNew"
   FROM grocery_invoice_items l JOIN invoices i ON i.invoice_id=l.invoice_id
   JOIN products p ON p.product_id=l.product_id AND p.dgt_id=i.dgt_id
   JOIN vendors v ON v.vendor_id=i.vendor_id AND v.dgt_id=i.dgt_id
   JOIN stores st ON st.dgt_id=i.dgt_id
   JOIN store_sub_departments s ON s.store_sub_department_id=p.store_sub_department_id AND s.dgt_id=p.dgt_id
   WHERE l.archived_at IS NULL AND i.dgt_id=? AND i.approved_at IS NOT NULL AND l.is_product_new
   ORDER BY p.product_id,COALESCE(i.received_date,i.invoice_date),l.grocery_invoice_item_id
   """,store);
  return Map.of("arrivals",rows.stream().map(Rows::normalize).toList());
 }
}
