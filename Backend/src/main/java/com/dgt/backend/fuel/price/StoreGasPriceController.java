package com.dgt.backend.fuel.price;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@RestController
@ConditionalOnProperty(name="app.gas.price.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/gas-prices")
public class StoreGasPriceController {
 private final ScopedAccess a;private final ObjectMapper json;private final GasDashboardService dashboard;
 public StoreGasPriceController(ScopedAccess a,ObjectMapper json,GasDashboardService dashboard){this.a=a;this.json=json;this.dashboard=dashboard;}
 private void access(String store){if(a.admin(a.user(),a.company(store)))return;
  if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) JOIN store_role_permissions p ON p.dgt_id=r.dgt_id AND p.role_type_id=r.role_type_id WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name)='MANAGER' AND p.permission_code='GAS_SETTINGS' AND p.allowed)",Boolean.class,a.user(),store)))throw a.denied();}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 private ResponseStatusException conflict(String m){return new ResponseStatusException(HttpStatus.CONFLICT,m);}
 private List<Map<String,Object>> history(String store){return a.db.queryForList("""
 SELECT p.fuel_price_id::text AS id,p.fuel_grade_id::text AS "gradeId",g.grade_name AS "gradeName",p.cash_price AS cash,p.credit_price AS credit,
 p.effective_from AS "effectiveFrom",p.effective_to AS "effectiveTo",p.xmin::text AS version,
 CASE WHEN p.effective_to<=p.effective_from THEN (e.changes->>'oldCash')::numeric ELSE prev.cash_price END AS "oldCash",CASE WHEN p.effective_to<=p.effective_from THEN (e.changes->>'oldCredit')::numeric ELSE prev.credit_price END AS "oldCredit",
 concat_ws(' ',u.first_name,u.last_name) AS actor,
 e.changes->>'reason' AS reason,e.changes->>'notes' AS notes,
 CASE WHEN e.event_id IS NULL THEN 'Recorded' WHEN e.changes->>'mode'='scheduled' THEN 'Scheduled' ELSE 'Manual' END AS source,
 CASE WHEN p.effective_to<=p.effective_from THEN 'CANCELLED' WHEN p.effective_from>statement_timestamp() THEN 'SCHEDULED' WHEN p.effective_to IS NULL OR p.effective_to>statement_timestamp() THEN 'CURRENT' ELSE 'PREVIOUS' END AS status,
 (p.effective_from<=statement_timestamp() AND (p.effective_to IS NULL OR p.effective_to>statement_timestamp())) AS current
 FROM fuel_prices p JOIN fuel_grades g ON g.fuel_grade_id=p.fuel_grade_id JOIN users u ON u.user_id=p.changed_by
 LEFT JOIN LATERAL(SELECT cash_price,credit_price FROM fuel_prices x WHERE x.dgt_id=p.dgt_id AND x.fuel_grade_id=p.fuel_grade_id AND (x.effective_to IS NULL OR x.effective_to>x.effective_from) AND (x.effective_from,x.fuel_price_id)<(p.effective_from,p.fuel_price_id) ORDER BY x.effective_from DESC,x.fuel_price_id DESC LIMIT 1)prev ON true
 LEFT JOIN LATERAL(SELECT event_id,changes FROM access_audit_events WHERE dgt_id=p.dgt_id AND event_type='GAS_PRICE_CHANGED' AND target_id=p.fuel_price_id::text ORDER BY event_id DESC LIMIT 1)e ON true
 WHERE p.dgt_id=? ORDER BY p.effective_from DESC,p.fuel_price_id DESC
 """,store).stream().map(Rows::normalize).toList();}
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object get(@PathVariable String store){access(store);return data(store);}
 @GetMapping("/dashboard") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object dashboard(@PathVariable String store){access(store);var result=dashboard.tanks(store);result.put("prices",history(store).stream().filter(p->"CURRENT".equals(p.get("status"))).toList());return result;}
 private Object data(String store){return Map.of("history",history(store),"grades",a.db.queryForList("SELECT fuel_grade_id::text AS id,grade_name AS name FROM fuel_grades WHERE is_active ORDER BY grade_name,fuel_grade_id"),"assignedGrades",a.db.queryForList("SELECT DISTINCT x.fuel_grade_id::text FROM fuel_tank_grade_assignments x JOIN fuel_tanks t USING(tank_id) WHERE t.dgt_id=? AND x.effective_from<=(CURRENT_TIMESTAMP AT TIME ZONE (SELECT timezone FROM stores WHERE dgt_id=?))::date AND (x.effective_to IS NULL OR x.effective_to>=(CURRENT_TIMESTAMP AT TIME ZONE (SELECT timezone FROM stores WHERE dgt_id=?))::date)",String.class,store,store,store),"timezone",Objects.toString(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store),"UTC"));}
 public record Input(String gradeId,BigDecimal cash,BigDecimal credit,String reason,String notes,String effectiveTime,LocalDateTime scheduledFor,String overlapChoice){}
 private void price(BigDecimal p){if(p==null||p.signum()<=0||p.compareTo(new BigDecimal("9999999.999"))>0||p.stripTrailingZeros().scale()>3)throw bad("Enter positive cash and credit prices, with up to three decimal places");}
 @PostMapping @Transactional
 public Object save(@PathVariable String store,@RequestHeader(value="If-Match",required=false)String version,@RequestHeader("Idempotency-Key")UUID key,@RequestBody Input in){
  access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);access(store);
  if(in==null||in.gradeId()==null||!in.gradeId().matches("[1-9][0-9]{0,17}"))throw bad("Select a fuel grade");if(in.effectiveTime()!=null&&!Set.of("now","scheduled").contains(in.effectiveTime()))throw bad("Choose Now or Scheduled");long grade=Long.parseLong(in.gradeId());price(in.cash());price(in.credit());
  String reason=Objects.toString(in.reason(),"").trim(),notes=Objects.toString(in.notes(),"").trim();if(!Set.of("","market","competitor","cost","promotion").contains(reason)||notes.length()>2000)throw bad("Invalid reason or notes (maximum 2000 characters)");
  String mode=Objects.toString(in.effectiveTime(),"now");
  String payload=json.writeValueAsString(new Input(in.gradeId(),in.cash(),in.credit(),reason,notes,mode,in.scheduledFor(),in.overlapChoice()));
  var retry=a.db.queryForList("SELECT changes->>'payload' AS payload FROM access_audit_events WHERE dgt_id=? AND event_type='GAS_PRICE_CHANGED' AND changes->>'requestKey'=?",store,key.toString());
  if(!retry.isEmpty()){if(!Objects.equals(payload,retry.getFirst().get("payload")))throw conflict("This save request was already used for different values");return data(store);}
  if(a.db.queryForList("SELECT fuel_grade_id FROM fuel_grades WHERE fuel_grade_id=? AND is_active FOR SHARE",grade).isEmpty())throw bad("Fuel grade is unavailable");
  OffsetDateTime now=a.db.queryForObject("SELECT clock_timestamp()",OffsetDateTime.class);
  var existing=a.db.queryForList("SELECT *,xmin::text AS version FROM fuel_prices WHERE dgt_id=? AND fuel_grade_id=? AND (effective_to IS NULL OR effective_to>?) AND (effective_to IS NULL OR effective_to>effective_from) ORDER BY effective_from FOR UPDATE",store,grade,now);
  var active=existing.stream().filter(r->!time(r.get("effective_from")).isAfter(now)).toList();
  var upcoming=existing.stream().filter(r->time(r.get("effective_from")).isAfter(now)).toList();
  if(active.size()>1||upcoming.size()>1)throw conflict("This grade has overlapping prices. Existing records need review before a change");
  var old=active.isEmpty()?null:active.getFirst();var future=upcoming.isEmpty()?null:upcoming.getFirst();
  if(future!=null&&future.get("effective_to")!=null || old!=null&&((future==null&&old.get("effective_to")!=null)||(future!=null&&(old.get("effective_to")==null||!time(old.get("effective_to")).isEqual(time(future.get("effective_from")))))))throw conflict("Existing price intervals need review before a change");
  String expected=old==null?"0":old.get("fuel_price_id")+":"+old.get("version");if(!Objects.equals(expected,version))throw conflict("Price changed; close and reopen the form before saving");
  OffsetDateTime start=now,end=future==null?null:time(future.get("effective_from"));
  if(mode.equals("scheduled")){
   if(future!=null)throw conflict("This grade already has an upcoming price change. Cancel that schedule before replacing it");
   start=scheduledInstant(store,in.scheduledFor(),in.overlapChoice());if(!start.isAfter(now))throw bad("Choose a future date and time in the store timezone");end=null;
  }
  if(old!=null&&((BigDecimal)old.get("cash_price")).compareTo(in.cash())==0&&((BigDecimal)old.get("credit_price")).compareTo(in.credit())==0){if(mode.equals("scheduled"))throw bad("Scheduled prices must differ from the current prices");return data(store);}
  if(old!=null)a.db.update("UPDATE fuel_prices SET effective_to=?,updated_at=? WHERE fuel_price_id=? AND dgt_id=?",start,now,old.get("fuel_price_id"),store);
  Long id=a.db.queryForObject("INSERT INTO fuel_prices(dgt_id,fuel_grade_id,cash_price,credit_price,effective_from,effective_to,changed_by) VALUES (?,?,?,?,?,?,?) RETURNING fuel_price_id",Long.class,store,grade,in.cash(),in.credit(),start,end,a.user());
  var event=new LinkedHashMap<String,Object>();event.put("requestKey",key.toString());event.put("mode",mode);event.put("scheduledFor",in.scheduledFor());event.put("overlapChoice",in.overlapChoice());event.put("timezone",a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));event.put("payload",payload);event.put("reason",reason);event.put("notes",notes);event.put("oldCash",old==null?null:old.get("cash_price"));event.put("oldCredit",old==null?null:old.get("credit_price"));event.put("cash",in.cash());event.put("credit",in.credit());event.put("gradeId",in.gradeId());
  a.audit(store,"GAS_PRICE_CHANGED",id.toString(),json.writeValueAsString(event));return data(store);
 }
 private OffsetDateTime time(Object value){return ((java.sql.Timestamp)value).toInstant().atOffset(ZoneOffset.UTC);}
 private OffsetDateTime scheduledInstant(String store,LocalDateTime local,String choice){
  if(local==null)throw bad("Enter a scheduled date and time");
  String name=a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store);ZoneId zone;try{zone=ZoneId.of(name);}catch(Exception e){throw bad("Set a valid store timezone before scheduling");}
  var offsets=zone.getRules().getValidOffsets(local);
  if(offsets.isEmpty())throw bad("This local time does not exist because the clocks move forward. Choose another time");
  if(choice!=null&&!choice.isBlank()&&!Set.of("earlier","later").contains(choice))throw bad("Invalid repeated-time choice");
  if(offsets.size()>1&&!Set.of("earlier","later").contains(Objects.toString(choice,"")))throw bad("This clock time occurs twice. Select its first or second occurrence");
  return OffsetDateTime.of(local,offsets.get(offsets.size()>1&&"later".equals(choice)?1:0));
 }
 @PostMapping("/{priceId}/cancel") @Transactional
 public Object cancel(@PathVariable String store,@PathVariable long priceId,@RequestHeader(value="If-Match",required=false)String version){
  access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);access(store);
  var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM fuel_prices WHERE dgt_id=? AND fuel_price_id=? FOR UPDATE",store,priceId);
  if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Scheduled price not found in this store");var row=rows.getFirst();
  OffsetDateTime now=a.db.queryForObject("SELECT clock_timestamp()",OffsetDateTime.class),start=time(row.get("effective_from"));
  if(row.get("effective_to")!=null&&!time(row.get("effective_to")).isAfter(start))return data(store);
  if(!start.isAfter(now))throw conflict("This price is already effective and cannot be cancelled. Record a new price change instead");
  if(!Objects.equals(priceId+":"+row.get("version"),version))throw conflict("Schedule changed; refresh before cancelling");
  var all=a.db.queryForList("SELECT * FROM fuel_prices WHERE dgt_id=? AND fuel_grade_id=? AND (effective_to IS NULL OR effective_to>?) AND (effective_to IS NULL OR effective_to>effective_from) ORDER BY effective_from FOR UPDATE",store,row.get("fuel_grade_id"),now);
  if(row.get("effective_to")!=null||all.stream().filter(r->time(r.get("effective_from")).isAfter(now)).count()!=1||all.stream().filter(r->!time(r.get("effective_from")).isAfter(now)).count()>1)throw conflict("Existing price intervals need review before cancellation");
  for(var previous:all)if(!Objects.equals(previous.get("fuel_price_id"),priceId)){
   if(previous.get("effective_to")==null||!time(previous.get("effective_to")).isEqual(start))throw conflict("Existing price intervals need review before cancellation");
   a.db.update("UPDATE fuel_prices SET effective_to=NULL,updated_at=? WHERE fuel_price_id=? AND dgt_id=?",now,previous.get("fuel_price_id"),store);
  }
  a.db.update("UPDATE fuel_prices SET effective_to=effective_from,updated_at=? WHERE fuel_price_id=? AND dgt_id=?",now,priceId,store);
  a.audit(store,"GAS_PRICE_SCHEDULE_CANCELLED",Long.toString(priceId),json.writeValueAsString(Map.of("scheduledFor",start,"cash",row.get("cash_price"),"credit",row.get("credit_price"))));return data(store);
 }

}
