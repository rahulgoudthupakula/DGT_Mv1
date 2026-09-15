package com.dgt.backend.reports.scoped;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@ConditionalOnProperty(name={"app.tender.credit-card.enabled","app.tender.ebt.enabled","app.tender.fleet.enabled"},havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/tender-reports")
public class TenderReportsController {
 private final ScopedAccess a;
 public TenderReportsController(ScopedAccess a){this.a=a;}
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object get(@PathVariable String store,@RequestParam(defaultValue="card") String family,
   @RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end,
   @RequestParam(required=false) LocalDate asOf){
  if(!a.admin(a.user(),a.company(store))&&!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.dgt_id=? AND r.user_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name)='MANAGER')",Boolean.class,store,a.user())))throw a.denied();
  if(!Set.of("card","tender").contains(family))throw bad("Unknown report family");
  var today=LocalDate.now(ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store)));
  String dates=family.equals("card")?"SELECT business_date FROM credit_card_batches WHERE dgt_id=?":"SELECT business_date FROM ebt_batches WHERE dgt_id=? UNION ALL SELECT business_date FROM fleet_batches WHERE dgt_id=?";
  Object[] args=family.equals("card")?new Object[]{store,today}:new Object[]{store,store,today};
  var latest=a.db.queryForObject("SELECT max(business_date) FROM ("+dates+") d WHERE business_date<=?",LocalDate.class,args);
  if(latest==null)latest=today;
  if(asOf!=null){if(start!=null||end!=null)throw bad("Choose a period or an as-of date");end=asOf;start=LocalDate.of(1900,1,1);}
  else {if(end==null)end=latest;if(start==null)start=end.withDayOfMonth(1);}
  if(start.isAfter(end)||start.isBefore(LocalDate.of(1900,1,1))||end.isAfter(today)||(asOf==null&&ChronoUnit.DAYS.between(start,end)>365))throw bad("Choose up to 366 days ending today or earlier");
  var rows=new ArrayList<Map<String,Object>>();
  if(family.equals("card"))rows.addAll(a.db.queryForList("""
   SELECT b.*, 'card' AS kind,p.processor_name AS group_name,p.processor_id::text AS group_id,
    (SELECT coalesce(-sum(bp.payment_amount_snapshot) FILTER(WHERE bp.payment_amount_snapshot<0),0)
      FROM credit_card_batch_payments bp WHERE bp.batch_id=b.batch_id) AS refund_amount
   FROM credit_card_batches b JOIN credit_card_processors p ON p.processor_id=b.processor_id AND p.dgt_id=b.dgt_id
   WHERE b.dgt_id=? AND b.business_date BETWEEN ? AND ? ORDER BY b.business_date DESC,b.batch_id DESC
   """,store,start,end));
  else {
   rows.addAll(a.db.queryForList("""
    SELECT b.*, 'ebt' AS kind,'EBT (SNAP / Cash)' AS group_name,'ebt' AS group_id
    FROM ebt_batches b WHERE b.dgt_id=? AND b.business_date BETWEEN ? AND ?
    """,store,start,end));
   rows.addAll(a.db.queryForList("""
    SELECT b.*, 'fleet' AS kind,'Fleet ('||b.provider_name||')' AS group_name,lower(trim(b.provider_name)) AS group_id,
     (SELECT coalesce(-sum(bp.payment_amount_snapshot) FILTER(WHERE bp.payment_amount_snapshot<0),0)
       FROM fleet_batch_payments bp WHERE bp.batch_id=b.batch_id) AS refund_amount
    FROM fleet_batches b WHERE b.dgt_id=? AND b.business_date BETWEEN ? AND ?
    """,store,start,end));
  }
  return Map.of("today",today.toString(),"latest",latest.toString(),"start",start.toString(),"end",end.toString(),"rows",rows.stream().map(Rows::normalize).toList());
 }
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
}
