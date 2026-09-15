package com.dgt.backend.dailyclosing.scoped;

import com.dgt.backend.access.ScopedAccess;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Component;

/** Closing-specific breakdowns. Values are frozen with the closing sales snapshot. */
@Component
public class ClosingBreakdowns {
 private final ScopedAccess access;
 public ClosingBreakdowns(ScopedAccess access) { this.access=access; }
 private BigDecimal number(Object value) { return value==null?BigDecimal.ZERO:new BigDecimal(value.toString()); }
 private void add(Map<String,Object> fields,String key,Object value) { fields.put(key,number(fields.get(key)).add(number(value))); }
 public Map<String,Object> read(String store,LocalDate day,ZoneId zone) {
  var start=Timestamp.from(day.atStartOfDay(zone).toInstant());
  var end=Timestamp.from(day.plusDays(1).atStartOfDay(zone).toInstant());
  var fields=new LinkedHashMap<String,Object>();
  for(String key:List.of("Grocery – Tax","Grocery – NonTax","Cigarette Pack","Cigarette Carton","Cigarette Pack Count","Cigarette Carton Count","Scratch-off Sales","EBT/Foodstamp Batch","Fleet Card Amount Sold","Fleet Card Volume Sold")) fields.put(key,BigDecimal.ZERO);
  for(String grade:List.of("Regular","Plus","Super","Diesel")) {fields.put(grade+" Volume",BigDecimal.ZERO);fields.put(grade+" Amount Sold",BigDecimal.ZERO);}
  var warnings=new LinkedHashSet<String>();
  var lines=access.db.queryForList("""
   SELECT lower(trim(coalesce(d.store_department_name,''))) department,
    lower(trim(coalesce(p.unit_of_measure,''))) unit, lower(trim(p.product_name)) name,
    sum(sign*abs(i.quantity)) quantity, sum(sign*abs(i.line_total-i.tax_amount)) net,
    sum(sign*abs(i.taxable_amount)) taxable
   FROM (SELECT *,CASE WHEN transaction_type='SALE' THEN 1 ELSE -1 END sign FROM sales
    WHERE store_id=? AND sale_datetime>=? AND sale_datetime<? AND
     ((sale_status='COMPLETED' AND transaction_type='SALE') OR
      (sale_status IN ('COMPLETED','REFUNDED') AND transaction_type IN ('RETURN','REFUND')))) s
   JOIN sales_items i USING(sale_id)
   JOIN products p ON p.product_id=i.product_id AND p.dgt_id=s.store_id
   LEFT JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=s.store_id
   LEFT JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=s.store_id
   GROUP BY d.store_department_name,p.unit_of_measure,p.product_name ORDER BY 1,2,3
   """,store,start,end);
  for(var line:lines) {
   String department=line.get("department").toString(),unit=line.get("unit").toString(),name=line.get("name").toString();
   BigDecimal net=number(line.get("net")),taxable=number(line.get("taxable"));
   if(Set.of("grocery","groceries","dairy & groceries").contains(department)) {
    add(fields,"Grocery – Tax",taxable);add(fields,"Grocery – NonTax",net.subtract(taxable));
   }
   if(department.equals("cigarettes")) {
    String kind=Set.of("pack","packs").contains(unit)?"Pack":Set.of("carton","cartons").contains(unit)?"Carton":null;
    if(kind==null) warnings.add("Some cigarette sales lack a pack/carton selling unit and are excluded from that breakdown.");
    else {add(fields,"Cigarette "+kind,net);add(fields,"Cigarette "+kind+" Count",line.get("quantity"));}
   }
   if(department.startsWith("lottery")&&department.contains("scratch")) add(fields,"Scratch-off Sales",net);
   if(Set.of("fuel","gas").contains(department)) {
    String grade=name.matches("^(regular)(\\b.*)?")?"Regular":name.matches("^(plus|mid[- ]?grade)(\\b.*)?")?"Plus":name.matches("^(super|premium)(\\b.*)?")?"Super":name.matches("^diesel(\\b.*)?")?"Diesel":null;
    if(grade==null||!Set.of("gallon","gallons","gal").contains(unit)) warnings.add("Some fuel products lack a recognized grade name or gallon selling unit and are excluded from grade breakdowns.");
    else {add(fields,grade+" Volume",line.get("quantity"));add(fields,grade+" Amount Sold",net);}
   }
  }
  var tenders=access.db.queryForList("""
   SELECT upper(t.tender_code) code,
    sum(CASE WHEN s.transaction_type='SALE' THEN abs(p.payment_amount) ELSE -abs(p.payment_amount) END) amount
   FROM sales s JOIN sale_payments p USING(sale_id) JOIN tender_types t USING(tender_type_id)
   WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<? AND p.payment_status IN ('COMPLETED','REFUNDED')
    AND ((s.sale_status='COMPLETED' AND s.transaction_type='SALE') OR
    (s.sale_status IN ('COMPLETED','REFUNDED') AND s.transaction_type IN ('RETURN','REFUND')))
   GROUP BY t.tender_code ORDER BY t.tender_code
   """,store,start,end);
  for(var tender:tenders) {
   String code=tender.get("code").toString();
   if(Set.of("EBT","SNAP","FOOD_STAMPS","EBT_SNAP").contains(code)) add(fields,"EBT/Foodstamp Batch",tender.get("amount"));
   if(Set.of("FLEET","FLEET_CARD").contains(code)) add(fields,"Fleet Card Amount Sold",tender.get("amount"));
  }
  // Payments are sale-level. Never allocate a split tender to individual fuel lines by guessing.
  var fleet=access.db.queryForMap("""
   WITH eligible AS (
    SELECT s.sale_id,CASE WHEN s.transaction_type='SALE' THEN 1 ELSE -1 END sign,
     bool_or(upper(t.tender_code) IN ('FLEET','FLEET_CARD')) has_fleet,
     bool_or(upper(t.tender_code) NOT IN ('FLEET','FLEET_CARD') AND p.payment_amount<>0) has_other
    FROM sales s JOIN sale_payments p USING(sale_id) JOIN tender_types t USING(tender_type_id)
    WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<? AND p.payment_status IN ('COMPLETED','REFUNDED')
     AND ((s.sale_status='COMPLETED' AND s.transaction_type='SALE') OR
      (s.sale_status IN ('COMPLETED','REFUNDED') AND s.transaction_type IN ('RETURN','REFUND')))
    GROUP BY s.sale_id
   ) SELECT coalesce(sum(e.sign*abs(i.quantity)) FILTER(WHERE NOT e.has_other),0) gallons,
    coalesce(bool_or(e.has_other),false) ambiguous
   FROM eligible e JOIN sales_items i USING(sale_id) JOIN products p ON p.product_id=i.product_id AND p.dgt_id=?
   JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id
   JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id
   WHERE e.has_fleet AND lower(trim(d.store_department_name)) IN ('fuel','gas')
    AND lower(trim(p.unit_of_measure)) IN ('gal','gallon','gallons')
   """,store,start,end,store);
  if(Boolean.TRUE.equals(fleet.get("ambiguous"))) {fields.remove("Fleet Card Volume Sold");warnings.add("Fleet gallons need POS line-level tender allocation for mixed-payment fuel receipts.");}
  else fields.put("Fleet Card Volume Sold",fleet.get("gallons"));
  return Map.of("fields",fields,"warnings",List.copyOf(warnings));
 }
}
