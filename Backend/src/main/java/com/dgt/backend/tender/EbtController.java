package com.dgt.backend.tender;

import com.dgt.backend.access.ScopedAccess;
import java.math.*;
import java.time.*;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@RestController
@ConditionalOnProperty(name="app.tender.ebt.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/ebt")
public class EbtController {
 private final ScopedAccess a;private final ObjectMapper json;
 public EbtController(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 private ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 private ResponseStatusException conflict(String s){return new ResponseStatusException(HttpStatus.CONFLICT,s);}
 private void access(String store){if(a.admin(a.user(),a.company(store)))return;if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name)='MANAGER')",Boolean.class,a.user(),store)))throw a.denied();}
 private void lock(String store){access(store);a.db.queryForObject("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",String.class,store);}
 private ZoneId zone(String store){return ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));}
 private LocalDate day(String store,LocalDate day){if(day==null||day.isBefore(LocalDate.of(1900,1,1))||day.isAfter(LocalDate.now(zone(store))))throw bad("Choose a business date today or earlier");return day;}
 private BigDecimal n(Object v){return v==null?BigDecimal.ZERO:new BigDecimal(v.toString());}
 private BigDecimal money(BigDecimal v,boolean negative){if(v==null||v.scale()>2||v.abs().compareTo(new BigDecimal("9999999999.99"))>0||!negative&&v.signum()<0)throw bad("Enter a valid amount with at most two decimal places");return v;}
 private String str(String v,int max,boolean required){if(v==null)v="";v=v.trim();if(v.length()>max||required&&v.isEmpty())throw bad("Enter a value of at most "+max+" characters");return v;}
 private void version(Map<String,Object> row,String v){if(!Objects.equals(row.get("version"),v))throw conflict("Record changed; reload before saving");}
 private void audit(String store,String kind,Object id,Object before,Object after){a.audit(store,"EBT_"+kind,String.valueOf(id),json.writeValueAsString(Map.of("before",before,"after",after)));}

 @GetMapping @Transactional(readOnly=true)
 public Object get(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end){
  access(store);var tz=zone(store);
  String latest=a.db.queryForObject("""
   SELECT max(business_day)::text FROM (
    SELECT (sale_datetime AT TIME ZONE ?)::date AS business_day FROM sales WHERE store_id=?
    UNION ALL SELECT business_date FROM ebt_batches WHERE dgt_id=?
   ) dates
   """,String.class,tz.getId(),store,store);
  LocalDate last=latest==null?LocalDate.now(tz):LocalDate.parse(latest);
  if(end==null)end=last;if(start==null)start=end.withDayOfMonth(1);
  day(store,start);day(store,end);
  if(start.isAfter(end)||java.time.temporal.ChronoUnit.DAYS.between(start,end)>365)throw bad("Choose a range of up to 366 days");
  return Map.of("today",LocalDate.now(tz),"latest",last,"start",start,"end",end,
   "batches",a.db.queryForList("SELECT b.*,b.xmin::text AS version,coalesce((SELECT json_agg(DISTINCT p.sale_id)::text FROM ebt_batch_payments bp JOIN sale_payments p USING(sale_payment_id) WHERE bp.batch_id=b.batch_id),'[]') AS receipt_ids_json,EXISTS(SELECT 1 FROM ebt_batch_payments p WHERE p.batch_id=b.batch_id AND p.benefit_type='SNAP') AS has_snap,EXISTS(SELECT 1 FROM ebt_batch_payments p WHERE p.batch_id=b.batch_id AND p.benefit_type='CASH') AS has_cash FROM ebt_batches b WHERE dgt_id=? AND business_date BETWEEN ? AND ? ORDER BY business_date DESC,batch_id DESC",store,start,end).stream().map(this::dateFields).toList());
 }

 private static final String PAYMENT_SQL="""
  SELECT p.sale_payment_id,s.sale_id,s.receipt_no,t.tender_code,
   CASE WHEN t.tender_code='EBT_SNAP' THEN 'SNAP' ELSE 'CASH' END benefit_type,
   CASE WHEN s.transaction_type='SALE' THEN abs(p.payment_amount) ELSE -abs(p.payment_amount) END amount,
   s.transaction_type,p.xmin::text||':'||s.xmin::text AS version
  FROM sale_payments p JOIN sales s USING(sale_id) JOIN tender_types t USING(tender_type_id)
  WHERE s.store_id=? AND s.sale_datetime>=? AND s.sale_datetime<?
   AND t.tender_code IN ('EBT_SNAP','EBT_CASH') AND p.payment_status IN ('COMPLETED','REFUNDED')
   AND ((s.transaction_type='SALE' AND s.sale_status='COMPLETED') OR
    (s.transaction_type IN ('REFUND','RETURN') AND s.sale_status IN ('COMPLETED','REFUNDED')))
   AND NOT EXISTS(SELECT 1 FROM ebt_batch_payments bp WHERE bp.sale_payment_id=p.sale_payment_id)
  ORDER BY p.sale_payment_id
  """;
 private List<Map<String,Object>> payments(String store,LocalDate date,boolean lock){
  day(store,date);var tz=zone(store);
  return a.db.queryForList(PAYMENT_SQL+(lock?" FOR UPDATE OF p,s":""),store,
   Timestamp.from(date.atStartOfDay(tz).toInstant()),Timestamp.from(date.plusDays(1).atStartOfDay(tz).toInstant()));
 }
 @GetMapping("/payments") @Transactional(readOnly=true)
 public Object available(@PathVariable String store,@RequestParam LocalDate date){access(store);return payments(store,date,false);}

 private Map<String,Object> dateFields(Map<String,Object> row){
  for(String key:List.of("business_date","settlement_date"))if(row.get(key) instanceof java.sql.Date d)row.put(key,d.toLocalDate().toString());
  return row;
 }
 private Map<String,Object> batch(String store,long id){
  var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM ebt_batches WHERE dgt_id=? AND batch_id=?",store,id);
  if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Batch not found");return dateFields(rows.getFirst());
 }
 @GetMapping("/batches/{id}") @Transactional(readOnly=true)
 public Object details(@PathVariable String store,@PathVariable long id){
  access(store);var row=batch(store,id);
  return Map.of("batch",row,"payments",a.db.queryForList("""
   SELECT bp.sale_payment_id,bp.benefit_type,bp.payment_amount_snapshot,s.receipt_no
   FROM ebt_batch_payments bp JOIN sale_payments p USING(sale_payment_id) JOIN sales s USING(sale_id)
   WHERE bp.batch_id=? AND s.store_id=? ORDER BY bp.sale_payment_id
   """,id,store),"audit",a.db.queryForList("""
   SELECT e.event_id,e.created_at,e.event_type,e.changes::text AS changes,u.first_name||' '||u.last_name AS actor
   FROM access_audit_events e LEFT JOIN users u ON u.user_id=e.actor_user_id
   WHERE e.dgt_id=? AND e.target_id=? AND e.event_type LIKE 'EBT_%' ORDER BY e.event_id DESC
   """,store,String.valueOf(id)));
 }
 public record Create(String reference,LocalDate date,UUID requestKey,Map<Long,String> payments){}
 @PostMapping("/batches") @Transactional
 public Object create(@PathVariable String store,@RequestBody Create in){
  lock(store);day(store,in.date());String ref=str(in.reference(),100,true);
  if(in.requestKey()==null||in.payments()==null||in.payments().isEmpty()||in.payments().size()>2000)throw bad("Select between 1 and 2000 EBT payments");
  var prior=a.db.queryForList("SELECT *,xmin::text AS version FROM ebt_batches WHERE dgt_id=? AND request_key=?",store,in.requestKey());
  if(!prior.isEmpty()){
   var row=prior.getFirst();var ids=new HashSet<>(a.db.queryForList("SELECT sale_payment_id FROM ebt_batch_payments WHERE batch_id=?",Long.class,row.get("batch_id")));
   if(!ids.equals(in.payments().keySet())||!ref.equals(row.get("batch_reference"))||!in.date().toString().equals(row.get("business_date").toString()))throw conflict("Request key already used with different batch details");
   return dateFields(row);
  }
  if(Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM ebt_batches WHERE dgt_id=? AND batch_reference=?)",Boolean.class,store,ref)))throw conflict("Batch reference already exists in this store");
  var chosen=payments(store,in.date(),true).stream().filter(p->in.payments().containsKey(((Number)p.get("sale_payment_id")).longValue())).toList();
  if(chosen.size()!=in.payments().size())throw conflict("Some payments are unavailable or already assigned to a batch");
  BigDecimal snap=BigDecimal.ZERO,cash=BigDecimal.ZERO,refund=BigDecimal.ZERO;Set<Long> receipts=new HashSet<>();
  for(var p:chosen){
   if(!Objects.equals(p.get("version"),in.payments().get(((Number)p.get("sale_payment_id")).longValue())))throw conflict("Payment changed; reload available payments");
   var amount=n(p.get("amount"));if("SNAP".equals(p.get("benefit_type")))snap=snap.add(amount);else cash=cash.add(amount);
   if(amount.signum()<0)refund=refund.add(amount.abs());receipts.add(((Number)p.get("sale_id")).longValue());
  }
  money(snap,true);money(cash,true);money(refund,false);money(snap.add(cash),true);
  long id=a.db.queryForObject("""
   INSERT INTO ebt_batches(dgt_id,batch_reference,business_date,snap_amount,cash_amount,refund_amount,transaction_count,created_by,request_key)
   VALUES (?,?,?,?,?,?,?,?,?) RETURNING batch_id
   """,Long.class,store,ref,in.date(),snap,cash,refund,receipts.size(),a.user(),in.requestKey());
  for(var p:chosen)a.db.update("INSERT INTO ebt_batch_payments(batch_id,sale_payment_id,benefit_type,payment_amount_snapshot) VALUES (?,?,?,?)",id,p.get("sale_payment_id"),p.get("benefit_type"),p.get("amount"));
  var saved=batch(store,id);audit(store,"BATCH_CREATED",id,Map.of(),saved);return saved;
 }
 public record Settlement(String version,BigDecimal fees,BigDecimal adjustment,String adjustmentReason,
  BigDecimal actualDeposit,LocalDate date,String reference,String notes){}
 @PutMapping("/batches/{id}/settlement") @Transactional
 public Object settle(@PathVariable String store,@PathVariable long id,@RequestBody Settlement in){
  lock(store);var old=batch(store,id);version(old,in.version());
  if("RECONCILED".equals(old.get("status")))throw conflict("Reconciled batches are locked");
  money(in.fees(),false);money(in.adjustment(),true);money(in.actualDeposit(),true);day(store,in.date());
  if(in.date().isBefore(LocalDate.parse(old.get("business_date").toString())))throw bad("Settlement date cannot precede the business date");
  String reason=str(in.adjustmentReason(),1000,in.adjustment().signum()!=0),ref=str(in.reference(),160,true),notes=str(in.notes(),2000,false);
  money(n(old.get("snap_amount")).add(n(old.get("cash_amount"))).add(in.adjustment()).subtract(in.fees()),true);
  a.db.update("""
   UPDATE ebt_batches SET fees=?,adjustment_amount=?,adjustment_reason=?,actual_deposit=?,settlement_date=?,
    settlement_reference=?,notes=?,status='SETTLED',settled_by=?,variance_review_note=NULL,updated_at=clock_timestamp()
   WHERE batch_id=? AND dgt_id=?
   """,in.fees(),in.adjustment(),reason,in.actualDeposit(),in.date(),ref,notes,a.user(),id,store);
  var saved=batch(store,id);audit(store,"SETTLEMENT_SAVED",id,old,saved);return saved;
 }
 public record Review(String version,String note){}
 @PostMapping("/batches/{id}/reconcile") @Transactional
 public Object reconcile(@PathVariable String store,@PathVariable long id,@RequestBody Review in){
  lock(store);var old=batch(store,id);version(old,in.version());
  if(!"SETTLED".equals(old.get("status")))throw conflict("Only settled batches can be reconciled");
  BigDecimal expected=n(old.get("snap_amount")).add(n(old.get("cash_amount"))).add(n(old.get("adjustment_amount"))).subtract(n(old.get("fees")));
  String note=str(in.note(),1000,n(old.get("actual_deposit")).compareTo(expected)!=0);
  a.db.update("UPDATE ebt_batches SET status='RECONCILED',reconciled_by=?,variance_review_note=?,updated_at=clock_timestamp() WHERE batch_id=? AND dgt_id=?",a.user(),note,id,store);
  var saved=batch(store,id);audit(store,"RECONCILED",id,old,saved);return saved;
 }
}
