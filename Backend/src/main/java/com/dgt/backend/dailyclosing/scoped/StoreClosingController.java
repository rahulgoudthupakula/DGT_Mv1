package com.dgt.backend.dailyclosing.scoped;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.sales.activity.LiveActivityController;
import com.dgt.backend.common.entity.Rows;
import java.math.*;
import java.time.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import tools.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@ConditionalOnProperty(name="app.daily-closing.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/daily-closing")
public class StoreClosingController {
 private final ScopedAccess a;private final LiveActivityController activity;private final ObjectMapper json;private final ClosingBreakdowns breakdowns;private final ClosingReconciliation reconciliation;
 public StoreClosingController(ScopedAccess a,LiveActivityController activity,ObjectMapper json,ClosingBreakdowns breakdowns,ClosingReconciliation reconciliation){this.a=a;this.activity=activity;this.json=json;this.breakdowns=breakdowns;this.reconciliation=reconciliation;}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private void access(String store){if(a.admin(a.user(),a.company(store)))return;if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.dgt_id=? AND r.user_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name)='MANAGER')",Boolean.class,store,a.user())))throw a.denied();}
 private ZoneId zone(String store){return ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));}
 private void date(String store,LocalDate date){if(date.isAfter(LocalDate.now(zone(store)))||date.isBefore(LocalDate.of(1900,1,1)))throw bad("Choose a business date today or earlier");}
 private BigDecimal amount(Object value){return value==null?BigDecimal.ZERO:new BigDecimal(value.toString());}
 private BigDecimal money(BigDecimal v){if(v==null||v.signum()<0||v.scale()>2||v.compareTo(new BigDecimal("999999999999.99"))>0)throw bad("Enter a non-negative amount with at most two decimal places");return v;}
 @SuppressWarnings("unchecked") private Map<String,Object> source(String store,LocalDate day){var raw=(Map<String,Object>)activity.get(store,day,day,null,"ALL",1,1);var m=new LinkedHashMap<String,Object>();for(String key:List.of("stats","tenders","departments"))m.put(key,raw.get(key));var tz=zone(store);var begin=java.sql.Timestamp.from(day.atStartOfDay(tz).toInstant());var end=java.sql.Timestamp.from(day.plusDays(1).atStartOfDay(tz).toInstant());
 m.put("breakdown",a.db.queryForMap("""
 WITH lines AS (SELECT i.*,CASE WHEN s.sale_status='COMPLETED' AND s.transaction_type='SALE' THEN 1 ELSE -1 END direction,
 lower(coalesce(d.store_department_name,'')) department
 FROM sales s JOIN sales_items i USING(sale_id) JOIN products p ON p.product_id=i.product_id AND p.dgt_id=s.store_id
 LEFT JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=s.store_id
 LEFT JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=s.store_id
 WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<? AND ((s.sale_status='COMPLETED' AND s.transaction_type='SALE') OR (s.sale_status IN ('COMPLETED','REFUNDED') AND s.transaction_type IN ('RETURN','REFUND')))),
 amounts AS (SELECT *,direction*abs(line_total-tax_amount) net,direction*abs(taxable_amount) taxable FROM lines)
 SELECT coalesce(sum(taxable) FILTER(WHERE department NOT IN ('fuel','gas') AND department NOT LIKE 'lottery%'),0) taxable,
 coalesce(sum(net-taxable) FILTER(WHERE department NOT IN ('fuel','gas') AND department NOT LIKE 'lottery%'),0) AS "nonTaxable",
 coalesce(sum(net) FILTER(WHERE department IN ('fuel','gas')),0) AS "gasSales",
 coalesce(sum(net) FILTER(WHERE department LIKE 'lottery%'),0) lottery
 FROM amounts
 """,store,begin,end));m.put("closingDetails",breakdowns.read(store,day,tz));
 var previous=a.db.queryForList("SELECT business_date::text AS date,actual_cash AS cash,closing_checks AS checks FROM everyday_closing WHERE dgt_id=? AND business_date=? AND closing_status='CLOSED'",store,day.minusDays(1));
 m.put("carryForward",previous.isEmpty()?Collections.emptyMap():previous.getFirst());return m;}
 private String token(Map<String,Object> source){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsString(source).getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
 @SuppressWarnings("unchecked") private Map<String,Object> snapshot(Object value){return json.readValue(value.toString(),LinkedHashMap.class);}
 @SuppressWarnings("unchecked") private BigDecimal cash(Map<String,Object> s){return ((List<Map<String,Object>>)s.get("tenders")).stream().filter(t->"CASH".equals(t.get("code"))).map(t->amount(t.get("amount"))).reduce(BigDecimal.ZERO,BigDecimal::add);}
 @SuppressWarnings("unchecked") private BigDecimal checks(Map<String,Object> source){return ((List<Map<String,Object>>)source.get("tenders")).stream().filter(t->Set.of("CHECK","CHECKS","CHEQUE","CHEQUES").contains(t.get("code"))).map(t->amount(t.get("amount"))).reduce(BigDecimal.ZERO,BigDecimal::add);}
 @GetMapping("/meta") @Transactional(readOnly=true)
 public Object meta(@PathVariable String store){access(store);var zone=zone(store);var result=new LinkedHashMap<String,Object>();result.put("today",LocalDate.now(zone).toString());result.put("timezone",zone.getId());result.put("openingDefault",a.db.queryForObject("SELECT default_opening_cash FROM stores WHERE dgt_id=?",BigDecimal.class,store));result.put("latest",a.db.queryForObject("SELECT max(business_day)::text FROM (SELECT (sale_datetime AT TIME ZONE ?)::date AS business_day FROM sales WHERE store_id=? UNION ALL SELECT business_date FROM everyday_closing WHERE dgt_id=?) d",String.class,zone.getId(),store,store));return result;}
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object list(@PathVariable String store,@RequestParam LocalDate start,@RequestParam LocalDate end){access(store);date(store,start);date(store,end);if(start.isAfter(end)||java.time.temporal.ChronoUnit.DAYS.between(start,end)>30)throw bad("Choose up to 31 days");var days=new ArrayList<Object>();for(LocalDate day=start;!day.isAfter(end);day=day.plusDays(1))days.add(day(store,day));return days;}
 @GetMapping("/{day}") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Map<String,Object> day(@PathVariable String store,@PathVariable LocalDate day){
  access(store);date(store,day);
  var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM everyday_closing WHERE dgt_id=? AND business_date=?",store,day);
  Map<String,Object> c=rows.isEmpty()?new HashMap<>():rows.getFirst();boolean closed="CLOSED".equals(c.get("closing_status"));
  var source=closed&&c.get("sales_snapshot")!=null?snapshot(c.get("sales_snapshot")):source(store,day);
  @SuppressWarnings("unchecked") var r=closed&&source.get("reconciliationSnapshot") instanceof Map<?,?> savedReadings?new LinkedHashMap<>((Map<String,Object>)savedReadings):reconciliation.read(c);
  var result=new LinkedHashMap<String,Object>();result.put("date",day.toString());result.put("timezone",zone(store).getId());
  result.put("version",c.getOrDefault("version","0"));result.put("status",c.getOrDefault("closing_status","OPEN"));result.put("isSample",c.getOrDefault("is_sample",false));
  result.put("notes",c.getOrDefault("notes",""));result.put("source",source);result.put("sourceToken",token(source));
  BigDecimal opening=rows.isEmpty()?a.db.queryForObject("SELECT default_opening_cash FROM stores WHERE dgt_id=?",BigDecimal.class,store):amount(c.get("opening_cash"));
  if(rows.isEmpty()&&source.get("carryForward") instanceof Map<?,?> previous&&!previous.isEmpty()) {
   opening=amount(previous.get("cash"));r.put("opening_checks",previous.get("checks"));result.put("carryForwardDate",previous.get("date"));
  }
  result.put("reconciliation",r);result.put("totalDeposits",reconciliation.deposits(r));
  result.put("openingCash",opening);result.put("cashAdded",amount(c.get("cash_added")));result.put("cashDrops",amount(c.get("cash_drops")));
  BigDecimal payouts=rows.isEmpty()?BigDecimal.ZERO:a.db.queryForObject("SELECT coalesce(sum(amount),0) FROM daily_expenses WHERE daily_expenses.archived_at IS NULL AND everyday_closing_id=? AND expenses_type='CLOSING_CASH_PAYOUT'",BigDecimal.class,c.get("everyday_closing_id"));result.put("payouts",payouts);
  BigDecimal expected=opening==null?null:opening.add(cash(source)).add(amount(c.get("cash_added"))).subtract(amount(c.get("cash_drops"))).subtract(payouts).subtract(reconciliation.cashOut(r));
  result.put("expectedCash",closed?c.get("expected_cash"):expected);result.put("actualCash",rows.isEmpty()?null:amount(c.get("actual_cash")));
  BigDecimal cashVariance=closed?amount(c.get("cash_variance")):rows.isEmpty()||expected==null?null:amount(c.get("actual_cash")).subtract(expected);
  BigDecimal expectedChecks=r.get("opening_checks")==null?null:amount(r.get("opening_checks")).add(checks(source)).subtract(amount(r.get("deposit_checks")));
  BigDecimal checkVariance=expectedChecks==null||r.get("closing_checks")==null?null:amount(r.get("closing_checks")).subtract(expectedChecks);
  result.put("expectedChecks",expectedChecks);result.put("checkVariance",checkVariance);result.put("cashVariance",cashVariance);
  result.put("variance",cashVariance==null?null:cashVariance.add(checkVariance==null?BigDecimal.ZERO:checkVariance));return result;
 }
 public record Save(String version,String sourceToken,BigDecimal openingCash,BigDecimal cashAdded,BigDecimal cashDrops,BigDecimal payouts,BigDecimal actualCash,String notes,boolean close,Map<String,BigDecimal> reconciliation){}
 @PutMapping("/{day}") @Transactional(isolation=Isolation.REPEATABLE_READ)
 @SuppressWarnings("unchecked") public Object save(@PathVariable String store,@PathVariable LocalDate day,@RequestBody Save in){access(store);date(store,day);money(in.openingCash());money(in.cashAdded());money(in.cashDrops());money(in.payouts());money(in.actualCash());if(in.notes()==null||in.notes().length()>2000)throw bad("Notes must be at most 2000 characters");a.db.queryForObject("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",String.class,store);var existing=a.db.queryForList("SELECT *,xmin::text AS version FROM everyday_closing WHERE dgt_id=? AND business_date=? FOR UPDATE",store,day);String version=existing.isEmpty()?"0":existing.getFirst().get("version").toString();if(!version.equals(in.version()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Closing changed; reload before saving");if(!existing.isEmpty()&&"CLOSED".equals(existing.getFirst().get("closing_status")))throw new ResponseStatusException(HttpStatus.CONFLICT,"This day is closed and cannot be edited");var source=source(store,day);if(!token(source).equals(in.sourceToken()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Sales or payments changed; reload and review before saving");var r=reconciliation.validate(in.reconciliation(),reconciliation.read(existing.isEmpty()?Collections.emptyMap():existing.getFirst()));if(amount(r.get("deposit_checks")).signum()>0&&(r.get("opening_checks")==null||amount(r.get("deposit_checks")).compareTo(amount(r.get("opening_checks")).add(checks(source)))>0))throw bad("Check deposits exceed opening checks plus checks received; enter the opening check balance");var stats=(Map<String,Object>)source.get("stats");BigDecimal expected=in.openingCash().add(cash(source)).add(in.cashAdded()).subtract(in.cashDrops()).subtract(in.payouts()).subtract(reconciliation.cashOut(r));if(expected.signum()<0)throw bad("Cash payouts and drops exceed the available drawer cash");var tz=zone(store);var begin=java.sql.Timestamp.from(day.atStartOfDay(tz).toInstant());var end=java.sql.Timestamp.from(day.plusDays(1).atStartOfDay(tz).toInstant());BigDecimal gross=a.db.queryForObject("SELECT coalesce(sum(subtotal+discount_amount),0) FROM sales WHERE store_id=? AND sale_datetime>=? AND sale_datetime<? AND sale_status='COMPLETED' AND transaction_type='SALE'",BigDecimal.class,store,begin,end);
 source.put("reconciliationSnapshot",new LinkedHashMap<>(r));
 long id;if(existing.isEmpty())id=a.db.queryForObject("INSERT INTO everyday_closing(dgt_id,business_date,opening_datetime,closing_datetime,closed_by,closing_status) VALUES (?,?,?,?,?,'DRAFT') RETURNING everyday_closing_id",Long.class,store,day,begin,end,a.user());else id=((Number)existing.getFirst().get("everyday_closing_id")).longValue();
 a.db.update("UPDATE everyday_closing SET opening_cash=?,cash_added=?,cash_drops=?,actual_cash=?,expected_cash=?,cash_variance=?,notes=?,closing_status=?,closed_by=?,sales_snapshot=?::jsonb,total_gross_sales=?,total_discounts=?,total_tax=?,total_net_sales=?,total_refunds=?,updated_at=clock_timestamp() WHERE everyday_closing_id=?",in.openingCash(),in.cashAdded(),in.cashDrops(),in.actualCash(),expected,in.actualCash().subtract(expected),in.notes(),in.close()?"CLOSED":"DRAFT",a.user(),json.writeValueAsString(source),gross,amount(stats.get("discounts")),amount(stats.get("tax")),amount(stats.get("netSales")).subtract(amount(stats.get("tax"))),amount(stats.get("refunds")),id);
 a.db.update("UPDATE daily_expenses SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND everyday_closing_id=? AND expenses_type='CLOSING_CASH_PAYOUT'",id);if(in.payouts().signum()>0)a.db.update("INSERT INTO daily_expenses(everyday_closing_id,expenses_date,expenses_type,description,amount,paid_by) VALUES (?,?,'CLOSING_CASH_PAYOUT','Cash payouts recorded in daily closing',?,?)",id,day,in.payouts(),a.user());a.db.update("UPDATE daily_closing_tenders SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND everyday_closing_id=?",id);for(var t:(List<Map<String,Object>>)source.get("tenders")){BigDecimal n=amount(t.get("amount"));a.db.update("INSERT INTO daily_closing_tenders(everyday_closing_id,tender_type,expected_amount,actual_amount,amount_difference,transaction_count) VALUES (?,?,?,?,0,?)",id,t.get("code"),n,n,a.db.queryForObject("SELECT count(DISTINCT s.sale_id) FROM sales s JOIN sale_payments p USING(sale_id) JOIN tender_types t USING(tender_type_id) WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<? AND t.tender_code=? AND p.payment_status IN ('COMPLETED','REFUNDED') AND ((s.sale_status='COMPLETED' AND s.transaction_type='SALE') OR (s.sale_status IN ('COMPLETED','REFUNDED') AND s.transaction_type IN ('RETURN','REFUND')))",Integer.class,store,begin,end,t.get("code")));}
 reconciliation.save(id,day,r);
 a.audit(store,in.close()?"DAILY_CLOSING_CLOSED":"DAILY_CLOSING_SAVED",Long.toString(id),json.writeValueAsString(Map.of("date",day.toString(),"openingCash",in.openingCash(),"expectedCash",expected,"actualCash",in.actualCash(),"cashDrops",in.cashDrops(),"payouts",in.payouts(),"reconciliation",r)));return day(store,day);
 }
}
