package com.dgt.backend.reports.scoped;

import com.dgt.backend.access.security.ScopedAccess;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/sales-statistics")
// Store-scoped dashboard endpoint returning backend-calculated summaries rather than individual item rows.
public class SalesStatisticsController {
 private final ScopedAccess a;
 public SalesStatisticsController(ScopedAccess a){this.a=a;}
 // Read metadata and aggregated statistics within one repeatable-read transaction.
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object get(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end){
  // Require pricebook read access to the selected store.
  a.grant(a.user(),store,"PRICE_BOOK",false);
  var zone=ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));var today=LocalDate.now(zone);
  // Find the latest eligible sale/return/refund date using the store timezone.
  var latest=a.db.queryForObject("""
   SELECT max((s.sale_datetime AT TIME ZONE ?)::date) FROM sales s
   WHERE s.store_id=? AND s.sale_datetime<? AND
    ((s.transaction_type='SALE' AND s.sale_status='COMPLETED') OR
     (s.transaction_type IN ('RETURN','REFUND') AND s.sale_status IN ('COMPLETED','REFUNDED')))
   """,LocalDate.class,zone.getId(),store,Timestamp.from(today.plusDays(1).atStartOfDay(zone).toInstant()));
  // Default to a 14-day range ending at the latest eligible date, or today when none exists.
  if(latest==null)latest=today;if(end==null)end=latest;if(start==null)start=end.minusDays(13);
  long days=ChronoUnit.DAYS.between(start,end)+1;
  if(days<1||days>366||end.isAfter(today)||start.isBefore(LocalDate.of(1901,1,1)))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose up to 366 days ending today or earlier");
  // Compare against the immediately preceding period with the same number of calendar days.
  var previousStart=start.minusDays(days);
  // Bind the store, timezone and period boundaries into the shared aggregate SQL.
  String summary=a.db.queryForObject(SUMMARY_SQL,String.class,zone.getId(),store,start,end,previousStart);
  var response=new LinkedHashMap<String,Object>();
  response.put("start",start.toString());response.put("end",end.toString());
  response.put("previousStart",previousStart.toString());response.put("days",days);
  response.put("today",today.toString());response.put("latest",latest.toString());response.put("timezone",zone.getId());
  // Schema version 2 identifies the summary response consumed by the dashboard.
  response.put("storeId",store);response.put("schemaVersion",2);
  response.put("stats",new tools.jackson.databind.ObjectMapper().readValue(summary,Map.class));
  return response;
 }
 private static final String SUMMARY_SQL=loadSummarySql();
 // Load the packaged SQL once; a missing/unreadable resource fails initialization.
 private static String loadSummarySql(){
  try(var input=new org.springframework.core.io.ClassPathResource("reports/sales-statistics.sql").getInputStream()){
   return new String(input.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);
  }catch(java.io.IOException e){throw new java.io.UncheckedIOException(e);}
 }
}
