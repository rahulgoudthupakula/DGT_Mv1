package com.dgt.backend.dailyclosing.scoped;

import com.dgt.backend.access.ScopedAccess;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ClosingReconciliation {
 private final ScopedAccess access;
 public ClosingReconciliation(ScopedAccess access){this.access=access;}
 public static final List<String> COLUMNS=List.of("opening_checks","closing_checks","card_jobber_settlement","card_bank_settlement",
  "lottery_online_sales","lottery_online_cash","lottery_scratch_cash","lottery_settlement","lottery_adjustment","lottery_online_credit","lottery_scratch_credit","lottery_commission","lottery_balance");
 private static final Map<String,String> EXPENSES=Map.of("cash_purchases","CLOSING_CASH_PURCHASE","pending_invoices_paid","CLOSING_PENDING_INVOICE_PAID");
 public static final List<String> NONNEGATIVE=List.of("opening_checks","closing_checks","cash_purchases","pending_invoices_paid","deposit_cash","deposit_checks");
 private BigDecimal n(Object v){return v==null?BigDecimal.ZERO:new BigDecimal(v.toString());}
 public Map<String,Object> read(Map<String,Object> closing){
  var result=new LinkedHashMap<String,Object>();for(String key:COLUMNS)result.put(key,closing.get(key));
  for(String key:EXPENSES.keySet())result.put(key,BigDecimal.ZERO);
  result.put("deposit_cash",BigDecimal.ZERO);result.put("deposit_checks",BigDecimal.ZERO);
  result.put("other_deposits",BigDecimal.ZERO);result.put("unallocated_deposits",false);
  Object id=closing.get("everyday_closing_id");if(id==null)return result;
  for(var entry:EXPENSES.entrySet()) result.put(entry.getKey(),access.db.queryForObject("SELECT coalesce(sum(amount),0) FROM daily_expenses WHERE daily_expenses.archived_at IS NULL AND everyday_closing_id=? AND expenses_type=?",BigDecimal.class,id,entry.getValue()));
  var deposits=access.db.queryForMap("""
   SELECT coalesce(sum(cash_amount) FILTER(WHERE closing_entry),0) cash,
    coalesce(sum(checks_amount) FILTER(WHERE closing_entry),0) checks,
    coalesce(sum(amount) FILTER(WHERE NOT closing_entry),0) other,
    coalesce(bool_or(NOT closing_entry AND (cash_amount IS NULL OR checks_amount IS NULL)),false) unallocated
   FROM daily_closing_deposits WHERE daily_closing_deposits.archived_at IS NULL AND everyday_closing_id=? AND upper(status) IN ('COMPLETED','DEPOSITED','CONFIRMED')
   """,id);
  result.put("deposit_cash",deposits.get("cash"));result.put("deposit_checks",deposits.get("checks"));result.put("other_deposits",deposits.get("other"));result.put("unallocated_deposits",deposits.get("unallocated"));return result;
 }
 public Map<String,Object> validate(Map<String,BigDecimal> submitted,Map<String,Object> existing){
  var result=new LinkedHashMap<>(existing);if(submitted==null)return result;
  var allowed=new HashSet<>(COLUMNS);allowed.addAll(EXPENSES.keySet());allowed.addAll(List.of("deposit_cash","deposit_checks"));
  for(var entry:submitted.entrySet()) {
   String key=entry.getKey();BigDecimal value=entry.getValue();
   if(!allowed.contains(key))throw bad("Unknown closing field: "+key);
   if(value!=null&&(value.scale()>2||value.abs().compareTo(new BigDecimal("9999999999.99"))>0||NONNEGATIVE.contains(key)&&value.signum()<0))throw bad("Enter a valid amount with at most two decimal places for "+key);
   result.put(key,value==null&&NONNEGATIVE.contains(key)&&!key.endsWith("checks")?BigDecimal.ZERO:value);
  }
  return result;
 }
 private ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 public BigDecimal cashOut(Map<String,Object> r){return n(r.get("cash_purchases")).add(n(r.get("pending_invoices_paid"))).add(n(r.get("deposit_cash")));}
 public BigDecimal deposits(Map<String,Object> r){return n(r.get("deposit_cash")).add(n(r.get("deposit_checks"))).add(n(r.get("other_deposits")));}
 public void save(long id,LocalDate day,Map<String,Object> r){
  for(String column:COLUMNS)access.db.update("UPDATE everyday_closing SET "+column+"=? WHERE everyday_closing_id=?",r.get(column),id);
  for(var entry:EXPENSES.entrySet()) {
   access.db.update("UPDATE daily_expenses SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND everyday_closing_id=? AND expenses_type=?",id,entry.getValue());
   if(n(r.get(entry.getKey())).signum()>0)access.db.update("INSERT INTO daily_expenses(everyday_closing_id,expenses_date,expenses_type,description,amount,paid_by) VALUES (?,?,?,?,?,?)",id,day,entry.getValue(),"Cash payment recorded in daily closing; does not mark an invoice paid",r.get(entry.getKey()),access.user());
  }
  access.db.update("UPDATE daily_closing_deposits SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND everyday_closing_id=? AND closing_entry",id);
  BigDecimal cash=n(r.get("deposit_cash")),checks=n(r.get("deposit_checks"));
  if(cash.add(checks).signum()>0)access.db.update("""
   INSERT INTO daily_closing_deposits(everyday_closing_id,deposit_date,bank_account_id,amount,deposited_by,status,closing_entry,cash_amount,checks_amount)
   VALUES (?,?,NULL,?,?,'DEPOSITED',true,?,?)
   """,id,day,cash.add(checks),access.user(),cash,checks);
  access.db.update("UPDATE everyday_closing SET total_deposits=? WHERE everyday_closing_id=?",deposits(r),id);
 }
}
