package com.dgt.backend.grocery.reports;

import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.util.*;
import java.time.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

// Detailed Grocery reports: purchases, product/day sales and current stock. Dashboard summaries use SalesStatisticsController.
@Slf4j
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/grocery-reports")
public class GroceryReportsController {
 private final ScopedAccess a;
 public GroceryReportsController(ScopedAccess a){this.a=a;}
 private void access(String store){a.grant(a.user(),store,"PRICE_BOOK",false);}
 private BigDecimal n(Object v){return v==null?BigDecimal.ZERO:new BigDecimal(v.toString());}
 // Aggregate invoice lines and charges separately to avoid multiplying header charges across item rows.
 private static final String PURCHASES="""
  WITH lines AS (SELECT l.invoice_id,sum(l.item_line_total) AS subtotal,sum(coalesce(l.line_tax,0)) AS tax
   FROM grocery_invoice_items l JOIN invoices i ON i.invoice_id=l.invoice_id
   JOIN products p ON p.product_id=l.product_id AND p.dgt_id=i.dgt_id
   WHERE l.archived_at IS NULL AND i.dgt_id=? GROUP BY l.invoice_id),
  charges AS (SELECT invoice_id,sum(coalesce(discounted_amount,0)) AS discount,
   sum(coalesce(freight_amount,0)+coalesce(fuel_surcharge,0)+coalesce(handling_fee,0)) AS expenses,
   CASE WHEN bool_and(upper(coalesce(payment_status,''))='PAID') THEN 'Paid'
    WHEN bool_and(upper(coalesce(payment_status,'')) IN ('UNPAID','PENDING')) THEN 'Unpaid'
    WHEN bool_or(upper(coalesce(payment_status,'')) IN ('PARTIAL','PARTIALLY_PAID')) THEN 'Partial' ELSE 'Unknown' END AS payment_status
   FROM invoice_charges WHERE charge_type='GROCERY' GROUP BY invoice_id)
  SELECT i.invoice_id::text AS id,to_char(i.invoice_date,'MM/DD/YYYY') AS date,
   to_char(i.invoice_date,'Dy') AS day,i.invoice_date::text AS "dateKey",i.invoice_number AS "invoiceNumber",
   v.vendor_name AS vendor,coalesce(l.subtotal,0) AS "purchaseAmount",coalesce(l.tax,0) AS "prepaidTax",
   coalesce(c.discount,0) AS discount,coalesce(c.expenses,0) AS expenses,
   coalesce(l.subtotal,0)+coalesce(l.tax,0)+coalesce(c.expenses,0)-coalesce(c.discount,0) AS "invoiceAmount",
   to_char(i.due_date,'MM/DD/YYYY') AS "paymentDueDate",coalesce(c.payment_status,'Unknown') AS "paymentStatus"
  FROM invoices i JOIN vendors v ON v.vendor_id=i.vendor_id AND v.dgt_id=i.dgt_id
  LEFT JOIN lines l ON l.invoice_id=i.invoice_id LEFT JOIN charges c ON c.invoice_id=i.invoice_id
  WHERE i.dgt_id=? AND i.invoice_type='GROCERY' AND i.approved_at IS NOT NULL
   AND (?::date IS NULL OR i.invoice_date>=?) AND (?::date IS NULL OR i.invoice_date<=?)
  ORDER BY i.invoice_date DESC,i.invoice_id DESC
  """;
 // Approved invoices only. Partial/unknown payment states do not provide enough data to infer paid amounts.
 @GetMapping("/purchases") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object purchases(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end){
  access(store);if(start!=null&&end!=null&&start.isAfter(end))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Start date must be before end date");
  var invoices=a.db.queryForList(PURCHASES,store,store,start,start,end,end);
  Map<String,Map<String,Object>> byId=new HashMap<>();
  for(var r:invoices){
   BigDecimal total=n(r.get("invoiceAmount"));String status=r.get("paymentStatus").toString();
   r.put("netPurchase",total);r.put("paidAmount",status.equals("Paid")?total:status.equals("Unpaid")?BigDecimal.ZERO:null);
   r.put("pendingAmount",status.equals("Paid")?BigDecimal.ZERO:status.equals("Unpaid")?total:null);
   for(String k:List.of("cash","eft","check","bank","rebateAmount"))r.put(k,null);
   byId.put(r.get("id").toString(),r);
  }
  var lines=a.db.queryForList("""
   SELECT i.invoice_id::text AS "invoiceId",l.grocery_invoice_item_id::text AS id,p.product_id::text AS "productId",
    p.product_name AS "productName",to_char(i.invoice_date,'MM/DD/YYYY') AS date,i.invoice_date::text AS "dateKey",
    v.vendor_name AS vendor,i.invoice_number AS "invoiceNumber",coalesce((SELECT min(product_barcode_value) FROM product_barcodes WHERE product_barcodes.archived_at IS NULL AND product_id=p.product_id),'') AS "scanCode",
    coalesce(p.product_sku,'') AS sku,coalesce(sub.store_sub_department_name,'Unassigned') AS category,
    coalesce(l.received_quantity,l.quantity)*CASE WHEN l.unit_type='CASE' THEN l.case_pack_quantity ELSE 1 END AS "receivedQty",
    l.unit_cost/NULLIF(CASE WHEN l.unit_type='CASE' THEN l.case_pack_quantity ELSE 1 END,0) AS "unitCost",
    l.item_line_total AS "extendedCost",l.quantity AS "invoicedQty",coalesce(l.item_line_discount,0) AS "lineDiscount"
   FROM invoices i JOIN grocery_invoice_items l ON l.archived_at IS NULL AND l.invoice_id=i.invoice_id
   JOIN products p ON p.product_id=l.product_id AND p.dgt_id=i.dgt_id
   JOIN vendors v ON v.vendor_id=i.vendor_id AND v.dgt_id=i.dgt_id
   LEFT JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=i.dgt_id
   WHERE i.dgt_id=? AND i.invoice_type='GROCERY' AND i.approved_at IS NOT NULL
   ORDER BY i.invoice_date,i.invoice_id,l.grocery_invoice_item_id
   """,store);
  // Read earlier purchase lines too, then select visible invoices, so the first displayed line retains its prior cost.
  Map<String,Map<String,Object>> previous=new HashMap<>();List<Map<String,Object>> visible=new ArrayList<>();
  for(var row:lines){
   String product=row.get("productId").toString();var old=previous.get(product);
   row.put("prevUnitCost",old==null?null:old.get("unitCost"));row.put("prevVendor",old==null?"":old.get("vendor"));
   row.put("rebate",null);row.put("invoiced",true);
   row.put("netCost",row.get("extendedCost")); // Invoice unit cost; no unallocated header discount or rebate assumed.
   previous.put(product,row);
   var invoice=byId.get(row.get("invoiceId").toString());if(invoice!=null){row.put("paymentStatus",invoice.get("paymentStatus"));visible.add(row);}
  }
  return Map.of("invoices",invoices.stream().map(Rows::normalize).toList(),"items",visible.stream().map(Rows::normalize).toList());
 }
 // Return product/day aggregates for both current and prior periods; refunds reverse quantities and recorded amounts.
 @GetMapping("/sales") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object sales(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end){
  access(store);ZoneId zone=ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));
  LocalDate today=LocalDate.now(zone);if(end==null)end=today;
  if(start==null){var first=a.db.queryForObject("SELECT min((sale_datetime AT TIME ZONE ?)::date) FROM sales WHERE store_id=?",LocalDate.class,zone.getId(),store);start=first==null?end:first;}
  long days=java.time.temporal.ChronoUnit.DAYS.between(start,end)+1;
  if(days<1||days>3660||end.isAfter(today))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a valid date range of at most ten years ending today or earlier");
  var rows=a.db.queryForList("""
   WITH activity AS (
    SELECT s.sale_datetime,l.*,CASE WHEN s.transaction_type='SALE' AND s.sale_status='COMPLETED' THEN 1
     WHEN s.transaction_type IN ('RETURN','REFUND') AND s.sale_status IN ('COMPLETED','REFUNDED') THEN -1 ELSE 0 END AS direction
    FROM sales s JOIN sales_items l USING(sale_id)
    JOIN pos_terminals t ON t.terminal_id=s.terminal_id AND t.store_id=s.store_id
    WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<?
   )
   SELECT p.product_id::text AS id,p.product_name AS name,
    coalesce((SELECT min(product_barcode_value) FROM product_barcodes WHERE product_barcodes.archived_at IS NULL AND product_id=p.product_id),'') AS "scanCode",
    coalesce(sub.store_sub_department_name,'Unassigned') AS category,coalesce(d.store_department_name,'Unassigned') AS department,
    to_char((a.sale_datetime AT TIME ZONE ?)::date,'YYYY-MM-DD') AS date,
    sum(a.direction*abs(a.quantity)) AS "unitsSold",
    sum(a.direction*(abs(a.gross_amount)-abs(a.discount_amount))) AS "netSales",
    sum(a.direction*abs(a.tax_amount)) AS tax,
    sum(a.direction*abs(a.discount_amount)) AS discounts,count(DISTINCT a.sale_id) AS transactions
   FROM activity a JOIN products p ON p.product_id=a.product_id AND p.dgt_id=?
   LEFT JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id
   LEFT JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id
   WHERE a.direction<>0 AND lower(coalesce(d.store_department_name,'')) NOT IN ('gas','fuel')
   GROUP BY p.product_id,sub.store_sub_department_name,d.store_department_name,6
   ORDER BY date,p.product_id
   """,store,java.sql.Timestamp.from(start.minusDays(days).atStartOfDay(zone).toInstant()),java.sql.Timestamp.from(end.plusDays(1).atStartOfDay(zone).toInstant()),zone.getId(),store);
  return Map.of("rows",rows.stream().map(Rows::normalize).toList(),"start",start.toString(),"end",end.toString(),"days",days);
 }

 // Current valuation inputs only: case costs become item costs, and missing inventory/prices stay null.
 @GetMapping("/stock") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object stock(@PathVariable String store){return stockSource(store,true);}
 private Object stockSource(String store,boolean includeMovements){
  access(store);
  var items=a.db.queryForList("""
   SELECT p.product_id::text AS id,p.product_name AS name,p.unit_of_measure AS unit,
    coalesce(b.brand_name,'Unassigned') AS brand,coalesce(sub.store_sub_department_name,'Unassigned') AS category,
    coalesce(d.store_department_name,'Unassigned') AS department,i.available_quantity AS qty,
    CASE WHEN p.purchase_unit='CASE' THEN (p.purchase_gross_cost-p.purchase_discount)/nullif(p.units_per_case,0)
      ELSE p.purchase_gross_cost-p.purchase_discount END AS cost,
    coalesce((SELECT g.group_price FROM product_price_groups l JOIN price_groups g ON g.price_group_id=l.price_group_id AND g.dgt_id=l.dgt_id
     WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id AND l.is_active AND g.is_active),
     (SELECT pr.retail_price FROM product_store_prices pr WHERE pr.product_id=p.product_id AND pr.dgt_id=p.dgt_id AND pr.is_active ORDER BY pr.store_price_id DESC LIMIT 1)) AS retail
   FROM products p LEFT JOIN inventory i ON i.product_id=p.product_id AND i.dgt_id=p.dgt_id
   LEFT JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id
   LEFT JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id
   LEFT JOIN brands b ON b.brand_id=p.brand_id
   WHERE p.dgt_id=? AND lower(coalesce(d.store_department_name,'')) NOT IN ('gas','fuel')
   ORDER BY p.product_id
   """,store);
  // Use store-local movement dates for consumers reconstructing earlier quantities; no stock writes occur here.
  var movements=includeMovements?a.db.queryForList("""
   SELECT m.movement_id::text AS id,m.product_id::text AS "productId",m.qty_changed AS qty,m.movement_type AS type,
    (m.created_at AT TIME ZONE s.timezone)::date::text AS date,m.unit_cost AS cost
   FROM inventory_movements m JOIN stores s ON s.dgt_id=m.dgt_id JOIN products p ON p.product_id=m.product_id AND p.dgt_id=m.dgt_id
   WHERE m.dgt_id=? ORDER BY m.created_at,m.movement_id
   """,store):List.<Map<String,Object>>of();
  return Map.of("items",items.stream().map(Rows::normalize).toList(),"movements",movements.stream().map(Rows::normalize).toList());
 }

 @SuppressWarnings("unchecked") private Map<String,Object> result(Object value){return (Map<String,Object>)value;}
 @SuppressWarnings("unchecked") private List<Map<String,Object>> rows(Map<String,Object> value,String key){return (List<Map<String,Object>>)value.get(key);}
 // Summary endpoints share the existing scoped source queries and one consistent read snapshot.
 @GetMapping("/sales-summary") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object salesSummary(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end,@RequestParam(defaultValue="") String department){
  var source=result(sales(store,start,end));var selected=rows(source,"rows").stream().filter(r->department.isEmpty()||r.get("department").toString().equalsIgnoreCase(department)).toList();
  return GroceryReportSummaries.sales(selected,source.get("start").toString(),((Number)source.get("days")).longValue());
 }
 @GetMapping("/stock-summary") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object stockSummary(@PathVariable String store){return GroceryReportSummaries.stock(rows(result(stockSource(store,false)),"items"));}
 @GetMapping("/profit-summary") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object profitSummary(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end,@RequestParam(defaultValue="") String search){
  var source=result(sales(store,start,end));return GroceryReportSummaries.profit(rows(source,"rows"),source.get("start").toString(),((Number)source.get("days")).longValue(),search);
 }
 @GetMapping("/ratio-summary") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object ratioSummary(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end){
  var source=result(sales(store,start,end));return GroceryReportSummaries.ratio(rows(source,"rows"),rows(result(purchases(store,start,end)),"invoices"),source.get("start").toString(),source.get("end").toString());
 }

 @GetMapping("/purchase-summary") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object purchaseSummary(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end,@RequestParam(defaultValue="") String search,@RequestParam org.springframework.util.MultiValueMap<String,String> filters,@RequestParam(defaultValue="all") String status){
  var source=result(purchases(store,start,end));var all=rows(source,"items");
  var vendors=filters.getOrDefault("vendor",List.of());
  var selected=all.stream().filter(r->(vendors.isEmpty()||vendors.contains("all")||vendors.contains(r.get("vendor")))&&!status.equals("uninvoiced")&&(search.isEmpty()||r.get("productName").toString().toLowerCase(Locale.ROOT).contains(search.toLowerCase(Locale.ROOT))||r.get("scanCode").toString().contains(search))).toList();
  for(var r:selected)r.put("costChangePercent",r.get("prevUnitCost")==null||n(r.get("prevUnitCost")).signum()<=0?null:GroceryReportSummaries.percent(n(r.get("unitCost")).subtract(n(r.get("prevUnitCost"))),r.get("prevUnitCost")));
  var invoiceTotals=GroceryReportSummaries.totals(rows(source,"invoices"),"netPurchase","invoiceAmount","paidAmount","pendingAmount","rebateAmount");invoiceTotals.put("invoiceTotal",invoiceTotals.get("invoiceAmount"));
  return Map.of("invoices",source.get("invoices"),"items",selected,"vendors",all.stream().map(r->r.get("vendor")).distinct().toList(),"invoiceTotals",invoiceTotals,"itemTotals",GroceryReportSummaries.totals(selected,"receivedQty","extendedCost","rebate","netCost"));
 }
 @GetMapping("/cigarette-summary") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object cigaretteSummary(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end,@RequestParam(defaultValue="false") boolean latest){
  if(start!=null&&end!=null&&start.isAfter(end))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Start date must be before end date");
  var sales=result(sales(store,null,null));var stock=result(stock(store));var purchases=result(purchases(store,null,null));
  var report=GroceryReportSummaries.cigarettes(rows(sales,"rows"),rows(stock,"items"),rows(stock,"movements"),rows(purchases,"items"),sales.get("start").toString());
  return GroceryReportSummaries.cigaretteWindow(report,start,end,latest);
 }

}
