package com.dgt.backend.reports.scoped;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import com.dgt.backend.dailyclosing.scoped.StoreClosingController;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@ConditionalOnProperty(name="app.daily-closing.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/pos-reports")
public class PosReportsController {
 private final ScopedAccess a;
 private final StoreClosingController closing;
 public PosReportsController(ScopedAccess a,StoreClosingController closing){this.a=a;this.closing=closing;}
 private void access(String store){if(a.admin(a.user(),a.company(store)))return;
  if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.dgt_id=? AND r.user_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name)='MANAGER')",Boolean.class,store,a.user())))throw a.denied();}
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object get(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end){
  access(store);ZoneId zone=ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));LocalDate today=LocalDate.now(zone);
  if(end==null){end=a.db.queryForObject("SELECT max((sale_datetime AT TIME ZONE ?)::date) FROM sales WHERE store_id=? AND sale_datetime<?",LocalDate.class,zone.getId(),store,Timestamp.from(today.plusDays(1).atStartOfDay(zone).toInstant()));if(end==null)end=today;}
  if(start==null)start=end;
  if(start.isAfter(end)||start.isBefore(LocalDate.of(1900,1,1))||end.isAfter(today)||ChronoUnit.DAYS.between(start,end)>365)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose up to 366 days ending today or earlier");
  var begin=Timestamp.from(start.atStartOfDay(zone).toInstant());var finish=Timestamp.from(end.plusDays(1).atStartOfDay(zone).toInstant());
  var rows=a.db.queryForList("""
   SELECT i.sales_item_id::text AS id,s.sale_id::text AS "saleId",p.product_id::text AS "productId",
    (s.sale_datetime AT TIME ZONE ?)::date::text AS date,extract(hour FROM s.sale_datetime AT TIME ZONE ?)::int AS hour,
    p.product_name AS name,coalesce(p.product_sku,'') AS sku,coalesce(p.unit_of_measure,'') AS unit,
    coalesce((SELECT min(product_barcode_value) FROM product_barcodes WHERE product_barcodes.archived_at IS NULL AND product_id=p.product_id),'') AS barcode,
    coalesce(d.store_department_name,'Unassigned') AS department,
    coalesce(sub.store_sub_department_name,'Unassigned') AS category,
    CASE WHEN s.transaction_type='SALE' THEN 1 ELSE -1 END AS direction,
    abs(i.quantity) AS quantity,abs(i.gross_amount) AS gross,abs(i.discount_amount) AS discount,
    abs(i.taxable_amount) AS taxable,abs(i.tax_amount) AS tax,i.unit_price AS price
   FROM sales s JOIN pos_terminals t ON t.terminal_id=s.terminal_id AND t.store_id=s.store_id
   JOIN sales_items i USING(sale_id) JOIN products p ON p.product_id=i.product_id AND p.dgt_id=s.store_id
   LEFT JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id
   LEFT JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id
   WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<? AND
    ((s.transaction_type='SALE' AND s.sale_status='COMPLETED') OR
     (s.transaction_type IN ('RETURN','REFUND') AND s.sale_status IN ('COMPLETED','REFUNDED')))
   ORDER BY s.sale_datetime,s.sale_id,i.sales_item_id
   """,zone.getId(),zone.getId(),store,begin,finish);
  var payments=a.db.queryForList("""
   SELECT s.sale_id::text AS "saleId",t.tender_code AS code,t.tender_name AS name,
    nullif(trim(p.card_brand),'') AS brand,abs(p.payment_amount) AS amount
   FROM sales s JOIN pos_terminals pt ON pt.terminal_id=s.terminal_id AND pt.store_id=s.store_id
   JOIN sale_payments p USING(sale_id) JOIN tender_types t USING(tender_type_id)
   WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<? AND p.payment_amount<>0 AND
    ((s.transaction_type='SALE' AND s.sale_status='COMPLETED' AND p.payment_status='COMPLETED') OR
     (s.transaction_type IN ('RETURN','REFUND') AND s.sale_status IN ('COMPLETED','REFUNDED') AND p.payment_status IN ('COMPLETED','REFUNDED')))
   ORDER BY s.sale_id,p.sale_payment_id
   """,store,begin,finish);
  var close=closing.day(store,end);
  var meta=a.db.queryForList("SELECT everyday_closing_id::text AS id,closed_by::text AS reviewer,updated_at AS updated FROM everyday_closing WHERE dgt_id=? AND business_date=?",store,end);
  var result=new LinkedHashMap<String,Object>();result.put("start",start.toString());result.put("end",end.toString());result.put("today",today.toString());result.put("timezone",zone.getId());
  result.put("rows",rows.stream().map(Rows::normalize).toList());result.put("payments",payments.stream().map(Rows::normalize).toList());result.put("closing",close);result.put("closingMeta",meta.isEmpty()?Map.of():Rows.normalize(meta.getFirst()));
  return result;
 }
}
