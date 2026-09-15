package com.dgt.backend.reports.scoped;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
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
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/sales-statistics")
public class SalesStatisticsController {
 private final ScopedAccess a;
 public SalesStatisticsController(ScopedAccess a){this.a=a;}
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object get(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end){
  a.grant(a.user(),store,"PRICE_BOOK",false);
  var zone=ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));var today=LocalDate.now(zone);
  var latest=a.db.queryForObject("""
   SELECT max((s.sale_datetime AT TIME ZONE ?)::date) FROM sales s
   WHERE s.store_id=? AND s.sale_datetime<? AND
    ((s.transaction_type='SALE' AND s.sale_status='COMPLETED') OR
     (s.transaction_type IN ('RETURN','REFUND') AND s.sale_status IN ('COMPLETED','REFUNDED')))
   """,LocalDate.class,zone.getId(),store,Timestamp.from(today.plusDays(1).atStartOfDay(zone).toInstant()));
  if(latest==null)latest=today;if(end==null)end=latest;if(start==null)start=end.minusDays(13);
  long days=ChronoUnit.DAYS.between(start,end)+1;
  if(days<1||days>366||end.isAfter(today)||start.isBefore(LocalDate.of(1901,1,1)))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose up to 366 days ending today or earlier");
  var previousStart=start.minusDays(days);
  var rows=a.db.queryForList("""
   SELECT i.sales_item_id::text AS id,s.sale_id::text AS "saleId",p.product_id::text AS "productId",
    (s.sale_datetime AT TIME ZONE ?)::date::text AS date,extract(hour FROM s.sale_datetime AT TIME ZONE ?)::int AS hour,
    p.product_name AS name,coalesce(p.unit_of_measure,'') AS unit,
    coalesce(d.store_department_name,'Unassigned') AS department,
    coalesce(sub.store_sub_department_name,'Unassigned') AS category,
    CASE WHEN s.transaction_type='SALE' THEN 1 ELSE -1 END AS direction,
    abs(i.quantity) AS quantity,abs(i.gross_amount) AS gross,abs(i.discount_amount) AS discount
   FROM sales s JOIN pos_terminals t ON t.terminal_id=s.terminal_id AND t.store_id=s.store_id
   JOIN sales_items i USING(sale_id) JOIN products p ON p.product_id=i.product_id AND p.dgt_id=s.store_id
   LEFT JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id
   LEFT JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id
   WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<? AND
    ((s.transaction_type='SALE' AND s.sale_status='COMPLETED') OR
     (s.transaction_type IN ('RETURN','REFUND') AND s.sale_status IN ('COMPLETED','REFUNDED')))
   ORDER BY s.sale_datetime,s.sale_id,i.sales_item_id
   """,zone.getId(),zone.getId(),store,Timestamp.from(previousStart.atStartOfDay(zone).toInstant()),Timestamp.from(end.plusDays(1).atStartOfDay(zone).toInstant()));
  return Map.of("start",start.toString(),"end",end.toString(),"previousStart",previousStart.toString(),"days",days,"today",today.toString(),"latest",latest.toString(),"timezone",zone.getId(),"rows",rows.stream().map(Rows::normalize).toList());
 }
}
