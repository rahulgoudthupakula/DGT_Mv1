package com.dgt.backend.sales.activity;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@ConditionalOnProperty(name="app.sales.activity.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/live-activity")
public class LiveActivityController {
 private final ScopedAccess a;
 public LiveActivityController(ScopedAccess a){this.a=a;}
 private void access(String store){if(a.admin(a.user(),a.company(store)))return;if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.dgt_id=? AND r.user_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name)='MANAGER')",Boolean.class,store,a.user())))throw a.denied();}
 private ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 private static final String FILTER="""
  WITH selected AS (SELECT s.* FROM sales s JOIN pos_terminals t ON t.terminal_id=s.terminal_id AND t.store_id=s.store_id
   WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<?
   AND (?::bigint IS NULL OR s.terminal_id=?) AND (?='ALL' OR s.transaction_type=?)),
  valued AS (SELECT s.*,CASE WHEN sale_status='COMPLETED' AND transaction_type='SALE' THEN 1
    WHEN sale_status IN ('COMPLETED','REFUNDED') AND transaction_type IN ('RETURN','REFUND') THEN -1 ELSE 0 END AS direction FROM selected s)
 """;
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object get(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end,@RequestParam(required=false) Long terminal,@RequestParam(defaultValue="ALL") String type,@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="25") int size){
  access(store);ZoneId zone;try{zone=ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));}catch(Exception e){throw bad("Configure the store timezone first");}
  Instant now=a.db.queryForObject("SELECT statement_timestamp()",java.sql.Timestamp.class).toInstant();LocalDate today=now.atZone(zone).toLocalDate();if(start==null)start=today;if(end==null)end=start;
  if(start.isAfter(end)||end.isAfter(today)||ChronoUnit.DAYS.between(start,end)>365||start.isBefore(LocalDate.of(1900,1,1)))throw bad("Choose up to 366 days ending today or earlier");
  if(page<1||page>100000||size<1||size>100||!Set.of("ALL","SALE","RETURN","REFUND","VOID").contains(type))throw bad("Invalid activity filter");
  if(terminal!=null&&a.db.queryForList("SELECT terminal_id FROM pos_terminals WHERE store_id=? AND terminal_id=?",store,terminal).isEmpty())throw bad("Terminal is not in this store");
  Object[] params={store,java.sql.Timestamp.from(start.atStartOfDay(zone).toInstant()),java.sql.Timestamp.from(end.plusDays(1).atStartOfDay(zone).toInstant()),terminal,terminal,type,type};
  var stats=a.db.queryForMap(FILTER+"""
   SELECT count(*) AS transactions,count(*) FILTER(WHERE direction=1) AS "saleCount",
   count(*) FILTER(WHERE direction=-1) AS "returnCount",count(*) FILTER(WHERE sale_status='VOIDED' OR transaction_type='VOID') AS "voidCount",
   coalesce(sum(CASE WHEN direction=1 THEN total_amount ELSE 0 END),0) AS "grossSales",
   coalesce(sum(CASE WHEN direction=-1 THEN abs(total_amount) ELSE 0 END),0) AS refunds,
   coalesce(sum(CASE WHEN direction=1 THEN total_amount WHEN direction=-1 THEN -abs(total_amount) ELSE 0 END),0) AS "netSales",
   coalesce(avg(total_amount) FILTER(WHERE direction=1),0) AS "averageTicket",
   coalesce(sum(CASE WHEN direction=1 THEN tax_amount WHEN direction=-1 THEN -abs(tax_amount) ELSE 0 END),0) AS tax,
   coalesce(sum(discount_amount) FILTER(WHERE direction=1),0) AS discounts
   FROM valued
   """,params);
  stats.put("gasVolume",a.db.queryForObject(FILTER+"""
   SELECT coalesce(sum(CASE WHEN v.direction=1 THEN i.quantity ELSE -abs(i.quantity) END),0)
   FROM valued v JOIN sales_items i USING(sale_id)
   JOIN products p ON p.product_id=i.product_id AND p.dgt_id=v.store_id
   JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=v.store_id
   JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=v.store_id
   WHERE v.direction<>0 AND lower(trim(p.unit_of_measure)) IN ('gallon','gallons','gal')
    AND lower(trim(d.store_department_name)) IN ('fuel','gas')
   """,java.math.BigDecimal.class,params));
  var tenders=a.db.queryForList(FILTER+"""
   SELECT t.tender_code AS code,t.tender_name AS name,
    coalesce(sum(CASE WHEN v.direction=1 AND p.payment_status='COMPLETED' THEN p.payment_amount
     WHEN v.direction=-1 AND p.payment_status IN ('COMPLETED','REFUNDED') THEN -abs(p.payment_amount) ELSE 0 END),0) AS amount
   FROM valued v JOIN sale_payments p USING(sale_id) JOIN tender_types t USING(tender_type_id)
   WHERE v.direction<>0 GROUP BY t.tender_type_id,t.tender_code,t.tender_name ORDER BY t.tender_name
   """,params);
  var top=a.db.queryForList(FILTER+"""
   SELECT p.product_id::text AS id,p.product_name AS name,p.unit_of_measure AS unit,
    sum(CASE WHEN v.direction=1 THEN i.quantity ELSE -abs(i.quantity) END) AS quantity,
    sum(CASE WHEN v.direction=1 THEN i.line_total ELSE -abs(i.line_total) END) AS amount
   FROM valued v JOIN sales_items i USING(sale_id) JOIN products p ON p.product_id=i.product_id AND p.dgt_id=v.store_id
   WHERE v.direction<>0 GROUP BY p.product_id,p.product_name,p.unit_of_measure ORDER BY amount DESC,p.product_id LIMIT 10
   """,params);
  var departments=a.db.queryForList(FILTER+"""
   SELECT d.store_department_name AS name,
    sum(CASE WHEN v.direction=1 THEN i.line_total ELSE -abs(i.line_total) END) AS amount,
    sum(CASE WHEN v.direction=1 THEN i.quantity ELSE -abs(i.quantity) END) AS quantity
   FROM valued v JOIN sales_items i USING(sale_id) JOIN products p ON p.product_id=i.product_id AND p.dgt_id=v.store_id
   JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=v.store_id
   JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=v.store_id
   WHERE v.direction<>0 GROUP BY d.store_department_id,d.store_department_name ORDER BY amount DESC
   """,params);
  var queryParams=new ArrayList<Object>(Arrays.asList(params));queryParams.add(size);queryParams.add((page-1)*size);
  var transactions=a.db.queryForList(FILTER+"""
   SELECT v.sale_id::text AS id,v.sale_datetime AS time,v.receipt_no AS receipt,v.transaction_id AS "transactionId",
    v.transaction_type AS type,v.sale_status AS status,v.subtotal,v.taxable_amount AS "taxableAmount",v.tax_amount AS tax,
    v.discount_amount AS discount,v.total_amount AS total,v.total_items AS "itemCount",t.terminal_code AS terminal,
    CASE WHEN EXISTS(SELECT 1 FROM employee_store_assignments x WHERE x.employee_id=e.employee_id AND x.dgt_id=v.store_id)
      THEN concat_ws(' ',e.first_name,e.last_name) ELSE 'Unmapped cashier' END AS cashier
   FROM valued v JOIN pos_terminals t ON t.terminal_id=v.terminal_id AND t.store_id=v.store_id LEFT JOIN employees e ON e.employee_id=v.cashier_id
   ORDER BY v.sale_datetime DESC,v.sale_id DESC LIMIT ? OFFSET ?
   """,queryParams.toArray());
  if(!transactions.isEmpty()){var ids=transactions.stream().map(tx->Long.parseLong(tx.get("id").toString())).collect(Collectors.toList());String ph=ids.stream().map(id->"?").collect(Collectors.joining(","));List<Object> pp=new ArrayList<>();pp.add(store);pp.addAll(ids);var allPayments=a.db.queryForList("SELECT s.sale_id,t.tender_code AS code,t.tender_name AS name,p.payment_amount AS amount,p.payment_status AS status,p.card_brand AS brand,p.card_last4 AS last4,p.payment_datetime AS time FROM sale_payments p JOIN sales s USING(sale_id) JOIN tender_types t USING(tender_type_id) WHERE s.store_id=? AND p.sale_id IN ("+ph+") ORDER BY p.sale_payment_id",pp.toArray());var byId=new java.util.HashMap<Long,List<Map<String,Object>>>();for(var p:allPayments){long sid=((Number)p.get("sale_id")).longValue();byId.computeIfAbsent(sid,k->new ArrayList<>()).add(Rows.normalize(p));}for(var tx:transactions){long id=Long.parseLong(tx.get("id").toString());tx.put("payments",byId.getOrDefault(id,List.of()));}}
  var range=Rows.normalize(a.db.queryForMap("SELECT min(sale_datetime AT TIME ZONE ?)::date AS first,max(sale_datetime AT TIME ZONE ?)::date AS last FROM sales WHERE store_id=?",zone.getId(),zone.getId(),store));
  var result=new LinkedHashMap<String,Object>();result.put("start",start.toString());result.put("end",end.toString());result.put("today",today.toString());result.put("timezone",zone.getId());result.put("asOf",now.toString());result.put("stats",Rows.normalize(stats));result.put("tenders",tenders);result.put("topItems",top);result.put("departments",departments);result.put("transactions",transactions.stream().map(Rows::normalize).toList());result.put("range",range);result.put("page",page);result.put("size",size);result.put("terminals",a.db.queryForList("SELECT terminal_id::text AS id,terminal_code AS code,terminal_name AS name FROM pos_terminals WHERE store_id=? ORDER BY terminal_code",store));
  result.put("importedWorkbook",Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM access_audit_events WHERE dgt_id=? AND event_type='SALES_WORKBOOK_IMPORTED')",Boolean.class,store)));return result;
 }
 private List<Map<String,Object>> payments(String store,long id){return a.db.queryForList("SELECT t.tender_code AS code,t.tender_name AS name,p.payment_amount AS amount,p.payment_status AS status,p.card_brand AS brand,p.card_last4 AS last4,p.payment_datetime AS time FROM sale_payments p JOIN sales s USING(sale_id) JOIN tender_types t USING(tender_type_id) WHERE s.store_id=? AND p.sale_id=? ORDER BY p.sale_payment_id",store,id).stream().map(Rows::normalize).toList();}
 @GetMapping("/{id}") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object detail(@PathVariable String store,@PathVariable long id){access(store);var rows=a.db.queryForList("SELECT s.*,s.sale_id::text AS id,t.terminal_code AS terminal FROM sales s JOIN pos_terminals t ON t.terminal_id=s.terminal_id AND t.store_id=s.store_id WHERE s.store_id=? AND s.sale_id=?",store,id);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Transaction not found in this store");var tx=Rows.normalize(rows.getFirst());tx.put("items",a.db.queryForList("SELECT i.sales_item_id::text AS id,p.product_name AS name,p.product_sku AS sku,p.unit_of_measure AS unit,i.quantity,i.unit_price AS price,i.catalog_price AS \"catalogPrice\",i.gross_amount AS gross,i.discount_amount AS discount,i.taxable_amount AS \"taxableAmount\",i.tax_amount AS tax,i.line_total AS total FROM sales_items i JOIN products p ON p.product_id=i.product_id JOIN sales s ON s.sale_id=i.sale_id AND s.store_id=p.dgt_id WHERE s.store_id=? AND i.sale_id=? ORDER BY i.sales_item_id",store,id));tx.put("payments",payments(store,id));return tx;}
}
