package com.dgt.backend.pricebook;

import java.util.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/rebates/claims")
public class StoreRebateClaimController {
 private final ScopedAccess a;
 public StoreRebateClaimController(ScopedAccess a){this.a=a;}
 private void access(String store){a.grant(a.user(),store,"PRICE_BOOK",true);}
 private void lock(String store){access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private ResponseStatusException conflict(){return new ResponseStatusException(HttpStatus.CONFLICT,"Claim changed or request conflicts; reload and retry");}
 private String text(Map<String,Object> in,String key,int max){String s=Objects.toString(in.get(key),"").trim();if(s.length()>max)throw bad(key+" is too long");return s;}
 private LocalDate date(Object value){try{return LocalDate.parse(value.toString());}catch(Exception e){throw bad("Enter a valid date");}}
 private long id(Object value){try{return Long.parseLong(value.toString());}catch(Exception e){throw bad("Choose a valid program");}}
 private BigDecimal money(Object value,boolean zero){try{BigDecimal n=new BigDecimal(value.toString());if(n.scale()>2||n.signum()<0||(!zero&&n.signum()==0)||n.compareTo(new BigDecimal("999999999999.99"))>0)throw bad("Enter a valid amount with at most two decimal places");return n;}catch(NumberFormatException|NullPointerException e){throw bad("Enter an amount");}}
 private Map<String,Object> one(String sql,Object... args){var rows=a.db.queryForList(sql,args);if(rows.size()!=1)throw bad("Record not found in this store");return rows.getFirst();}
 private LocalDate today(String store){return a.db.queryForObject("SELECT (CURRENT_TIMESTAMP AT TIME ZONE timezone)::date FROM stores WHERE dgt_id=?",LocalDate.class,store);}
 private void past(String store,LocalDate value){if(value.isAfter(today(store)))throw bad("Date cannot be in the future");}
 private void submit(String store,long claim,Map<String,Object> c,Map<String,Object> in){
  var p=one("SELECT * FROM rebate_programs WHERE program_id=? AND dgt_id=?",c.get("program_id"),store);
  if(!"Active".equals(p.get("status")))throw bad("Only active programs can receive submissions");
  if(date(c.get("period_start")).isBefore(date(p.get("start_date")))||date(c.get("period_end")).isAfter(date(p.get("end_date"))))throw bad("Claim period no longer matches the program dates");
  LocalDate submitted=date(in.get("submittedDate"));past(store,submitted);
  if(submitted.isBefore(date(c.get("period_start"))))throw bad("Submission cannot precede the claim period");
  a.db.update("UPDATE rebate_claims SET claimed_amount=?,submitted_date=?,submitted_by=?,status='SUBMITTED',program_snapshot=(SELECT to_jsonb(p) FROM rebate_programs p WHERE p.program_id=?),updated_at=now() WHERE claim_id=?",money(in.get("claimed"),false),submitted,a.user(),c.get("program_id"),claim);
 }
 @GetMapping public Object list(@PathVariable String store){
  access(store);
  var claims=a.db.queryForList("SELECT c.*,c.xmin::text AS version,COALESCE(c.program_snapshot->>'name',p.name) AS program,COALESCE(c.program_snapshot->>'provider_name',p.provider_name) AS provider,u.first_name||' '||u.last_name AS submitter FROM rebate_claims c JOIN rebate_programs p ON p.program_id=c.program_id AND p.dgt_id=c.dgt_id LEFT JOIN users u ON u.user_id=c.submitted_by WHERE c.dgt_id=? ORDER BY c.claim_id DESC",store);
  return claims.stream().map(c->{
   var payments=a.db.queryForList("SELECT payment_id::text AS id,amount,payment_method AS method,payment_date::text AS date,reference,notes FROM rebate_claim_payments WHERE claim_id=? AND dgt_id=? ORDER BY payment_id",c.get("claim_id"),store);
   BigDecimal paid=payments.stream().map(p->(BigDecimal)p.get("amount")).reduce(BigDecimal.ZERO,BigDecimal::add);
   BigDecimal approved=(BigDecimal)c.get("approved_amount"),claimed=(BigDecimal)c.get("claimed_amount");
   String status=switch(c.get("status").toString()){case "DRAFT"->"Not Submitted";case "SUBMITTED"->"Submitted";case "UNDER_REVIEW"->"Under Review";case "REJECTED"->"Rejected";default->paid.signum()>0?(paid.compareTo(approved)>=0?"Paid":"Partially Paid"):(approved.compareTo(claimed)<0?"Partially Approved":"Approved");};
   var r=new LinkedHashMap<String,Object>();r.put("id",c.get("claim_id").toString());r.put("version",c.get("version"));r.put("reference","CLM-"+c.get("claim_id"));r.put("program",c.get("program"));r.put("provider",c.get("provider"));r.put("period",c.get("period_start")+" – "+c.get("period_end"));r.put("periodRange",r.get("period"));r.put("earned",null);r.put("claimed",claimed);r.put("approved",approved);r.put("payment",paid);r.put("status",status);r.put("submittedDate",c.get("submitted_date"));r.put("submittedBy",c.get("submitter"));r.put("approvalDate",c.get("decision_date"));r.put("adjustmentReason",c.get("decision_reason"));r.put("notes",c.get("notes"));r.put("payments",payments);
   if(!payments.isEmpty()){var last=payments.getLast();r.put("paymentMethod",last.get("method"));r.put("paymentDate",last.get("date"));r.put("paymentRef",last.get("reference"));}
   return Rows.normalize(r);
  }).toList();
 }
 @PostMapping @Transactional public Object create(@PathVariable String store,@RequestBody Map<String,Object> in){
  lock(store);long program=id(in.get("programId"));var p=one("SELECT * FROM rebate_programs WHERE program_id=? AND dgt_id=?",program,store);
  if(!"Active".equals(p.get("status")))throw bad("Choose an active program");
  LocalDate start=date(in.get("periodStart")),end=date(in.get("periodEnd"));
  if(end.isBefore(start)||start.isBefore(date(p.get("start_date")))||end.isAfter(date(p.get("end_date"))))throw bad("Claim period must be inside program dates");
  if(!a.db.queryForList("SELECT claim_id FROM rebate_claims WHERE program_id=? AND period_start<=? AND period_end>=?",program,end,start).isEmpty())throw bad("A claim already covers this period");
  String action=text(in,"action",20);if(!Set.of("draft","submit").contains(action))throw bad("Choose draft or submit");
  BigDecimal amount=in.get("claimed")==null||in.get("claimed").toString().isBlank()?null:money(in.get("claimed"),false);
  long claim=a.db.queryForObject("INSERT INTO rebate_claims(dgt_id,program_id,period_start,period_end,claimed_amount,created_by) VALUES (?,?,?,?,?,?) RETURNING claim_id",Long.class,store,program,start,end,amount,a.user());
  if(action.equals("submit"))submit(store,claim,one("SELECT * FROM rebate_claims WHERE claim_id=?",claim),in);
  a.audit(store,"REBATE_CLAIM_CREATED",Long.toString(claim),"{}");return Map.of("id",claim);
 }
 @PostMapping("/{claim}/actions") @Transactional public Object action(@PathVariable String store,@PathVariable long claim,@RequestHeader("If-Match") String version,@RequestBody Map<String,Object> in){
  lock(store);var c=one("SELECT *,xmin::text AS version FROM rebate_claims WHERE claim_id=? AND dgt_id=? FOR UPDATE",claim,store);
  String action=text(in,"action",20),status=c.get("status").toString();
  UUID key=null;
  if(action.equals("payment")){
   try{key=UUID.fromString(text(in,"requestKey",50));}catch(Exception e){throw bad("Payment request ID is required");}
   var previous=a.db.queryForList("SELECT * FROM rebate_claim_payments WHERE dgt_id=? AND request_key=?",store,key);
   if(!previous.isEmpty()){var old=previous.getFirst();if(((Number)old.get("claim_id")).longValue()!=claim||((BigDecimal)old.get("amount")).compareTo(money(in.get("payment"),false))!=0||!old.get("payment_method").equals(text(in,"paymentMethod",30))||!old.get("reference").equals(text(in,"paymentRef",150))||!date(old.get("payment_date")).equals(date(in.get("paymentDate"))))throw conflict();return Map.of("saved",true);}
  }
  if(!Objects.equals(c.get("version"),version))throw conflict();
  switch(action){
   case "submit" -> {if(!status.equals("DRAFT"))throw bad("Only draft claims can be submitted");submit(store,claim,c,in);}
   case "review" -> {if(!status.equals("SUBMITTED"))throw bad("Only submitted claims can enter review");a.db.update("UPDATE rebate_claims SET status='UNDER_REVIEW' WHERE claim_id=?",claim);}
   case "approve","reject" -> {
    if(!Set.of("SUBMITTED","UNDER_REVIEW").contains(status))throw bad("Only submitted claims can receive a decision");
    BigDecimal amount=action.equals("reject")?BigDecimal.ZERO:money(in.get("approved"),false),requested=(BigDecimal)c.get("claimed_amount");
    if(amount.compareTo(requested)>0)throw bad("Approval cannot exceed the claimed amount");
    String reason=text(in,"adjustmentReason",2000);if(amount.compareTo(requested)<0&&reason.isBlank())throw bad("Enter a reason for reducing or rejecting the claim");
    LocalDate decision=date(in.get("approvalDate"));past(store,decision);if(decision.isBefore(date(c.get("submitted_date"))))throw bad("Decision cannot precede submission");
    a.db.update("UPDATE rebate_claims SET status=?,approved_amount=?,decision_date=?,decision_reason=?,decision_recorded_by=? WHERE claim_id=?",action.equals("reject")?"REJECTED":"APPROVED",amount,decision,reason,a.user(),claim);
   }
   case "payment" -> {
    if(!status.equals("APPROVED"))throw bad("Record payments only after approval");
    BigDecimal paid=a.db.queryForObject("SELECT coalesce(sum(amount),0) FROM rebate_claim_payments WHERE claim_id=?",BigDecimal.class,claim),amount=money(in.get("payment"),false);
    if(paid.add(amount).compareTo((BigDecimal)c.get("approved_amount"))>0)throw bad("Payment exceeds the outstanding balance");
    String method=text(in,"paymentMethod",30),ref=text(in,"paymentRef",150);
    if(!Set.of("ACH Transfer","Check","Vendor Credit","Invoice Deduction","Wire Transfer").contains(method)||ref.isBlank())throw bad("Choose a payment method and enter its reference");
    LocalDate day=date(in.get("paymentDate"));past(store,day);if(day.isBefore(date(c.get("decision_date"))))throw bad("Payment cannot precede approval");
    a.db.update("INSERT INTO rebate_claim_payments(dgt_id,claim_id,request_key,amount,payment_method,payment_date,reference,recorded_by) VALUES (?,?,?,?,?,?,?,?)",store,claim,key,amount,method,day,ref,a.user());
   }
   case "notes" -> a.db.update("UPDATE rebate_claims SET notes=? WHERE claim_id=?",text(in,"notes",4000),claim);
   default -> throw bad("Unknown claim action");
  }
  a.db.update("UPDATE rebate_claims SET updated_at=now() WHERE claim_id=?",claim);
  a.audit(store,"REBATE_CLAIM_"+action.toUpperCase(Locale.ROOT),Long.toString(claim),"{}");return Map.of("saved",true);
 }
}
