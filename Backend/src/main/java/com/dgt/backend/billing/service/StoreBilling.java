package com.dgt.backend.billing.service;

import java.util.*;
import java.time.*;
import java.math.BigDecimal;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@EnableScheduling
@ConditionalOnProperty(name="app.billing.enabled",havingValue="true")
public class StoreBilling {
 private final ScopedAccess access;private final TransactionTemplate transactions;
 public StoreBilling(ScopedAccess access,TransactionTemplate transactions){this.access=access;this.transactions=transactions;}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private String reference(String store){return access.db.queryForObject("SELECT store_id FROM stores WHERE dgt_id=?",String.class,store);}
 public LocalDate today(String store){String zone=access.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store);if(zone==null)throw bad("Set this store's timezone before managing billing");return LocalDate.now(ZoneId.of(zone));}
 private Map<String,Object> subscription(String ref){var rows=access.db.queryForList("SELECT ss.*,ss.xmin::text AS version,p.plan_name,p.monthly_price FROM store_subscriptions ss JOIN subscription_plans p USING(subscription_plan_id) WHERE store_id=?",ref);return rows.isEmpty()?null:rows.getFirst();}
 private LocalDate date(Object v){return ((java.sql.Date)v).toLocalDate();}
 private LocalDate next(LocalDate start,int anchor){var month=start.plusMonths(1);return month.withDayOfMonth(Math.min(anchor,month.lengthOfMonth()));}
 public Object read(String store){access.requireAdmin(store);return view(store);}
 private Object view(String store){var result=new LinkedHashMap<String,Object>();var sub=subscription(reference(store));result.put("subscription",sub==null?null:Rows.normalize(sub));result.put("addons",access.db.queryForList("SELECT a.*,coalesce(sa.active,false) AS active,coalesce(sa.cancel_at_period_end,false) AS cancel_at_period_end FROM billing_addons a LEFT JOIN store_billing_addons sa ON sa.addon_id=a.addon_id AND sa.subscription_id=? ORDER BY a.addon_id",sub==null?null:sub.get("subscription_id")).stream().map(Rows::normalize).toList());result.put("plans",access.db.queryForList("SELECT subscription_plan_id,plan_name,monthly_price FROM subscription_plans ORDER BY monthly_price").stream().map(Rows::normalize).toList());result.put("invoices",access.db.queryForList("SELECT invoice_id,invoice_number,invoice_date,period_start,period_end,subtotal,tax_amount,total_amount,dgt_invoice_status,invoice_kind,plan_name_snapshot,currency FROM billing_invoices WHERE store_id=? ORDER BY invoice_date DESC,invoice_id DESC",reference(store)).stream().map(Rows::normalize).toList());return result;}
 private void lock(String store){access.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",access.company(store));access.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);}
 private void invoice(Map<String,Object> sub,LocalDate day,String kind,BigDecimal amount,String name,long planId){access.db.update("INSERT INTO billing_invoices(store_id,subscription_plan_id,invoice_number,invoice_date,period_start,period_end,subtotal,tax_amount,total_amount,dgt_invoice_status,subscription_id,invoice_kind,plan_name_snapshot) VALUES (?,?,?,?,?,?,?,0,?,'DUE',?,?,?)",sub.get("store_id"),planId,"DGT-"+UUID.randomUUID(),day,sub.get("current_period_start"),sub.get("current_period_end"),amount,amount,sub.get("subscription_id"),kind,name);}
 // Called within the same company/store lock as commands; a unique index prevents duplicate renewal invoices.
 private void advanceLocked(String store,LocalDate day){String ref=reference(store);var sub=subscription(ref);int periods=0;
  while(sub!=null&&"ACTIVE".equals(sub.get("subscription_status"))&&!date(sub.get("current_period_end")).isAfter(day)){
   if(++periods>120)throw bad("Billing is more than 120 periods behind; review required");
   if(!Boolean.TRUE.equals(sub.get("auto_renewal"))){access.db.update("UPDATE store_billing_addons SET active=false,updated_at=CURRENT_TIMESTAMP WHERE subscription_id=?",sub.get("subscription_id"));access.db.update("UPDATE store_subscriptions SET subscription_status='CANCELLED',cancelled_at=CURRENT_TIMESTAMP,next_billing_date=NULL,updated_at=CURRENT_TIMESTAMP WHERE subscription_id=?",sub.get("subscription_id"));break;}
   LocalDate start=date(sub.get("current_period_end")),end=next(start,date(sub.get("start_date")).getDayOfMonth());BigDecimal price=(BigDecimal)sub.get("monthly_price");
   access.db.update("UPDATE store_subscriptions SET current_period_start=?,current_period_end=?,next_billing_date=?,current_period_price=?,updated_at=CURRENT_TIMESTAMP WHERE subscription_id=?",start,end,end,price,sub.get("subscription_id"));sub=subscription(ref);invoice(sub,start,"RENEWAL",price,(String)sub.get("plan_name"),((Number)sub.get("subscription_plan_id")).longValue());
   access.db.update("UPDATE store_billing_addons SET active=false,updated_at=CURRENT_TIMESTAMP WHERE subscription_id=? AND cancel_at_period_end=true",sub.get("subscription_id"));
   for(var addon:access.db.queryForList("SELECT a.* FROM billing_addons a JOIN store_billing_addons sa USING(addon_id) WHERE sa.subscription_id=? AND sa.active=true",sub.get("subscription_id")))invoice(sub,start,"ADDON",(BigDecimal)addon.get("monthly_price"),(String)addon.get("name"),((Number)sub.get("subscription_plan_id")).longValue());
  }
 }
 public void advance(String store,LocalDate day){transactions.executeWithoutResult(tx->{lock(store);advanceLocked(store,day);});}
 @Scheduled(fixedDelay=60000,initialDelay=60000) public void renewDue(){for(var row:access.db.queryForList("SELECT s.dgt_id FROM stores s JOIN store_subscriptions ss ON ss.store_id=s.store_id WHERE ss.subscription_status='ACTIVE' AND s.company_id IS NOT NULL AND s.timezone IS NOT NULL")){String store=(String)row.get("dgt_id");try{advance(store,today(store));}catch(Exception e){org.slf4j.LoggerFactory.getLogger(StoreBilling.class).warn("Billing renewal failed for store {}",store,e);}}}
 public record Command(String action,Long planId,String version){}
 @Transactional public Object change(String store,Command c,UUID key){
  access.requireAdmin(store);lock(store);access.requireAdmin(store);long user=access.user();
  if(!Set.of("START","CHANGE","CANCEL","ADDON_ADD","ADDON_CANCEL").contains(c.action()==null?"":c.action()))throw bad("Invalid billing action");
  var previous=access.db.queryForList("SELECT dgt_id,action,plan_id FROM billing_change_requests WHERE user_id=? AND request_key=?",user,key);
  if(!previous.isEmpty()){var p=previous.getFirst();if(!Objects.equals(store,p.get("dgt_id"))||!Objects.equals(c.action(),p.get("action"))||!Objects.equals(c.planId(),p.get("plan_id")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Request key already used");return view(store);}
  String ref=reference(store);LocalDate day=today(store);var sub=subscription(ref);
  if(!Objects.equals(c.version(),sub==null?"0":sub.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Billing changed; reload before saving");
  if(sub!=null&&"ACTIVE".equals(sub.get("subscription_status"))&&!date(sub.get("current_period_end")).isAfter(day))throw new ResponseStatusException(HttpStatus.CONFLICT,"Billing period is closing; refresh after the renewal check");
  if(c.action().startsWith("ADDON_")){
   if(sub==null||!"ACTIVE".equals(sub.get("subscription_status"))||!Boolean.TRUE.equals(sub.get("auto_renewal")))throw bad("Add-ons require an active renewing subscription");
   var addons=access.db.queryForList("SELECT a.*,coalesce(sa.active,false) AS active,coalesce(sa.cancel_at_period_end,false) AS cancel_pending FROM billing_addons a LEFT JOIN store_billing_addons sa ON sa.addon_id=a.addon_id AND sa.subscription_id=? WHERE a.addon_id=?",sub.get("subscription_id"),c.planId());
   if(addons.isEmpty())throw bad("Choose a valid add-on");var addon=addons.getFirst();
   if(c.action().equals("ADDON_ADD")){
    if(Boolean.TRUE.equals(addon.get("active")))throw bad("Add-on already active");
    access.db.update("INSERT INTO store_billing_addons(subscription_id,addon_id) VALUES (?,?) ON CONFLICT(subscription_id,addon_id) DO UPDATE SET active=true,cancel_at_period_end=false,updated_at=CURRENT_TIMESTAMP",sub.get("subscription_id"),c.planId());
    invoice(sub,day,"ADDON",(BigDecimal)addon.get("monthly_price"),(String)addon.get("name"),((Number)sub.get("subscription_plan_id")).longValue());
   }else{
    if(!Boolean.TRUE.equals(addon.get("active")))throw bad("Add-on is not active");
    access.db.update("UPDATE store_billing_addons SET cancel_at_period_end=true,updated_at=CURRENT_TIMESTAMP WHERE subscription_id=? AND addon_id=?",sub.get("subscription_id"),c.planId());
   }
   access.db.update("UPDATE store_subscriptions SET updated_at=CURRENT_TIMESTAMP WHERE subscription_id=?",sub.get("subscription_id"));
  }else if(c.action().equals("CANCEL")){
   if(c.planId()!=null)throw bad("Cancellation does not take a plan");
   if(sub==null||!"ACTIVE".equals(sub.get("subscription_status")))throw bad("No active subscription");
   access.db.update("UPDATE store_subscriptions SET auto_renewal=false,cancel_requested_at=coalesce(cancel_requested_at,CURRENT_TIMESTAMP),next_billing_date=NULL,updated_at=CURRENT_TIMESTAMP WHERE subscription_id=?",sub.get("subscription_id"));
  }else{
   var plans=c.planId()==null?List.<Map<String,Object>>of():access.db.queryForList("SELECT * FROM subscription_plans WHERE subscription_plan_id=?",c.planId());if(plans.size()!=1)throw bad("Choose a valid plan");var plan=plans.getFirst();BigDecimal price=(BigDecimal)plan.get("monthly_price");
   if(c.action().equals("START")){
    if(sub!=null)throw bad("Subscription already exists; contact support to reactivate a cancelled subscription");
    LocalDate end=next(day,day.getDayOfMonth());access.db.update("INSERT INTO store_subscriptions(store_id,subscription_plan_id,subscription_status,start_date,current_period_start,current_period_end,next_billing_date,auto_renewal,current_period_price) VALUES (?,?,'ACTIVE',?,?,?,?,true,?)",ref,c.planId(),day,day,end,end,price);
    sub=subscription(ref);invoice(sub,day,"INITIAL",price,(String)plan.get("plan_name"),c.planId());
   }else{
    if(sub==null||!"ACTIVE".equals(sub.get("subscription_status"))||!Boolean.TRUE.equals(sub.get("auto_renewal")))throw bad("Plan changes require an active subscription without scheduled cancellation");
    if(Objects.equals(c.planId(),((Number)sub.get("subscription_plan_id")).longValue()))throw bad("This plan is already selected");
    BigDecimal committed=(BigDecimal)sub.get("current_period_price"),extra=price.subtract(committed).max(BigDecimal.ZERO);
    if(extra.signum()>0)invoice(sub,day,"UPGRADE",extra,(String)plan.get("plan_name"),c.planId());
    access.db.update("UPDATE store_subscriptions SET subscription_plan_id=?,current_period_price=?,updated_at=CURRENT_TIMESTAMP WHERE subscription_id=?",c.planId(),committed.max(price),sub.get("subscription_id"));
   }
  }
  access.db.update("INSERT INTO billing_change_requests(user_id,request_key,dgt_id,action,plan_id) VALUES (?,?,?,?,?)",user,key,store,c.action(),c.planId());
  access.audit(store,"SUBSCRIPTION_"+c.action(),ref,"{\"planId\":"+c.planId()+"}");return view(store);
 }
}
