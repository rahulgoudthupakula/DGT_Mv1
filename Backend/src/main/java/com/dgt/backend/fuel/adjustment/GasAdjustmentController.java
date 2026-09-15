package com.dgt.backend.fuel.adjustment;

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
@ConditionalOnProperty(name="app.gas.adjustments.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/gas-adjustments")
public class GasAdjustmentController {
 private final ScopedAccess a; private final ObjectMapper json;
 public GasAdjustmentController(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 private static final String VIEW="GAS_VIEW_ADJUSTMENTS",EDIT="GAS_RECORD_ADJUSTMENT",APPROVE="GAS_APPROVE_ADJUSTMENT";
 private boolean admin(String store){return a.admin(a.user(),a.company(store));}
 private boolean allowed(String store,String code){if(admin(store))return true;return Boolean.TRUE.equals(a.db.queryForObject("""
 SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id)
 JOIN store_role_permissions p ON p.dgt_id=r.dgt_id AND p.role_type_id=r.role_type_id
 WHERE r.dgt_id=? AND r.user_id=? AND r.is_active AND t.is_active AND p.permission_code=? AND p.allowed
 AND upper(t.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT') AND (?<> 'GAS_APPROVE_ADJUSTMENT' OR upper(t.role_type_name)='MANAGER'))
 """,Boolean.class,store,a.user(),code,code));}
 private void access(String store,String code){if(!allowed(store,code))throw a.denied();}
 private void read(String store){if(!allowed(store,VIEW)&&!allowed(store,EDIT)&&!allowed(store,APPROVE))throw a.denied();}
 private void lock(String store){a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);}
 private ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 private ResponseStatusException conflict(String s){return new ResponseStatusException(HttpStatus.CONFLICT,s);}
 private String text(String s,int max){String v=s==null?"":s.trim();if(v.length()>max)throw bad("Text exceeds "+max+" characters");return v;}
 private LocalDate today(String store){try{return LocalDate.now(ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store)));}catch(Exception e){throw bad("Configure the store timezone first");}}
 private BigDecimal gallons(BigDecimal x){if(x==null||x.signum()<0||x.compareTo(new BigDecimal("1000000000"))>=0||x.stripTrailingZeros().scale()>3)throw bad("Gallons must be zero or greater with up to 3 decimal places");return x;}
 public record Line(long tankId,long gradeId,BigDecimal systemGallons,BigDecimal actualGallons,long readingId,Long movementId,String reason){}
 public record Input(LocalDate date,String notes,List<Line> lines,boolean submit){}
 public record Decision(String reason){}
 public record Reading(BigDecimal gallons){}
 private Map<String,Object> tank(String store,long id){
  var ts=a.db.queryForList("SELECT tank_id::text AS id,tank_number AS number,tank_name AS name,capacity_gallons AS capacity FROM fuel_tanks WHERE tank_id=? AND dgt_id=?",id,store);
  if(ts.isEmpty())throw bad("Tank does not belong to this store");var t=ts.getFirst();
  var grades=a.db.queryForList("SELECT x.fuel_grade_id::text AS \"gradeId\",g.grade_name AS \"gradeName\" FROM fuel_tank_grade_assignments x JOIN fuel_grades g USING(fuel_grade_id) WHERE x.tank_id=? AND x.effective_from<=? AND (x.effective_to IS NULL OR x.effective_to>=?) AND g.is_active",id,today(store),today(store));
  t.put("gradeId",grades.size()==1?grades.getFirst().get("gradeId"):null);t.put("gradeName",grades.size()==1?grades.getFirst().get("gradeName"):null);
  var readings=a.db.queryForList("SELECT tank_reading_id,volume_gallons,reading_datetime FROM fuel_tank_readings WHERE tank_id=? AND reading_datetime<=statement_timestamp() ORDER BY reading_datetime DESC,tank_reading_id DESC LIMIT 1",id);
  t.put("readingId",null);t.put("movementId",null);t.put("systemGallons",null);
  if(!readings.isEmpty()){
   var r=readings.getFirst();var m=a.db.queryForMap("SELECT max(movement_id) AS id,coalesce(sum(qty_changed),0) AS qty FROM inventory_movements WHERE dgt_id=? AND tank_id=? AND created_at>?",store,id,r.get("reading_datetime"));
   t.put("readingId",r.get("tank_reading_id").toString());t.put("movementId",m.get("id")==null?null:m.get("id").toString());
   t.put("systemGallons",((BigDecimal)r.get("volume_gallons")).add((BigDecimal)m.get("qty")));
  }
  return t;
 }
 private List<Map<String,Object>> lines(String store,long id){return a.db.queryForList("""
 SELECT l.*,l.adjustment_line_id::text AS id,l.tank_id::text AS "tankId",l.fuel_grade_id::text AS "gradeId",
 l.system_gallons AS "systemGallons",l.actual_gallons AS "actualGallons",l.difference_gallons AS difference,
 l.baseline_reading_id::text AS "readingId",l.baseline_movement_id::text AS "movementId",t.tank_number AS "tankNumber",g.grade_name AS "gradeName"
 FROM fuel_adjustment_lines l JOIN fuel_tanks t ON t.tank_id=l.tank_id AND t.dgt_id=l.dgt_id JOIN fuel_grades g USING(fuel_grade_id)
 WHERE l.archived_at IS NULL AND l.dgt_id=? AND l.adjustment_id=? ORDER BY l.adjustment_line_id
 """,store,id).stream().map(Rows::normalize).toList();}
 private Map<String,Object> detail(String store,long id){var rs=a.db.queryForList("""
 SELECT x.adjustment_id::text AS id,x.xmin::text AS version,x.adjustment_date AS date,x.status,x.notes,
 x.created_at AS "createdAt",x.reviewed_at AS "reviewedAt",x.rejection_reason AS "rejectionReason",
 concat_ws(' ',u.first_name,u.last_name) AS "createdBy",concat_ws(' ',r.first_name,r.last_name) AS "reviewedBy",x.created_by AS "creatorId"
 FROM fuel_adjustments x JOIN users u ON u.user_id=x.created_by LEFT JOIN users r ON r.user_id=x.reviewed_by
 WHERE x.dgt_id=? AND x.adjustment_id=?
 """,store,id);if(rs.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Adjustment not found in this store");var row=rs.getFirst();row.put("lines",lines(store,id));boolean own=((Number)row.get("creatorId")).longValue()==a.user();row.put("canEdit",allowed(store,EDIT)&&(own||allowed(store,APPROVE)));row.put("canApprove",allowed(store,APPROVE)&&(!own||admin(store)));return Rows.normalize(row);}
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object list(@PathVariable String store){read(store);var records=a.db.queryForList("SELECT adjustment_id FROM fuel_adjustments WHERE dgt_id=? ORDER BY adjustment_id DESC",Long.class,store).stream().map(id->detail(store,id)).toList();var tanks=a.db.queryForList("SELECT tank_id FROM fuel_tanks WHERE dgt_id=? ORDER BY tank_number",Long.class,store).stream().map(id->tank(store,id)).toList();return Map.of("records",records,"tanks",tanks,"today",today(store).toString(),"canEdit",allowed(store,EDIT),"canApprove",allowed(store,APPROVE),"isAdmin",admin(store));}
 @PostMapping("/tanks/{tankId}/initial-reading") @Transactional
 public Object initialReading(@PathVariable String store,@PathVariable long tankId,@RequestBody Reading in){
  a.requireAdmin(store);lock(store);a.requireAdmin(store);a.db.queryForList("SELECT tank_id FROM fuel_tanks WHERE tank_id=? AND dgt_id=? FOR UPDATE",tankId,store);var t=tank(store,tankId);
  if(!a.db.queryForList("SELECT tank_reading_id FROM fuel_tank_readings WHERE tank_id=?",tankId).isEmpty())throw conflict("This tank already has a reading; reload its current gallons");
  BigDecimal g=gallons(in.gallons());if(g.stripTrailingZeros().scale()>2)throw bad("Initial tank readings support up to 2 decimal places");if(g.compareTo((BigDecimal)t.get("capacity"))>0)throw bad("Gallons exceed tank capacity");if(t.get("gradeId")==null)throw bad("Assign a fuel grade in Gas Settings first");
  a.db.update("INSERT INTO fuel_tank_readings(tank_id,reading_datetime,volume_gallons,created_by) VALUES (?,clock_timestamp(),?,?)",tankId,g,a.user());a.audit(store,"GAS_INITIAL_READING",Long.toString(tankId),json.writeValueAsString(in));return list(store);
 }
 private void validate(String store,Input in){
  if(in==null||in.date()==null||!in.date().equals(today(store)))throw bad("Use today's store-local date; adjustments compare against current recorded gallons");
  text(in.notes(),5000);if(in.lines()==null||in.lines().isEmpty()||in.lines().size()>50)throw bad("Enter 1–50 tank adjustments");Set<Long> seen=new HashSet<>();
  for(var l:in.lines()){
   if(l==null||!seen.add(l.tankId()))throw bad("Choose each tank only once");a.db.queryForList("SELECT tank_id FROM fuel_tanks WHERE tank_id=? AND dgt_id=? FOR UPDATE",l.tankId(),store);var t=tank(store,l.tankId());
   if(t.get("gradeId")==null||!t.get("gradeId").equals(Long.toString(l.gradeId())))throw conflict("Tank grade changed or is unassigned. Refresh the form");
   if(t.get("systemGallons")==null)throw bad("Record an initial measured tank reading first");
   if(!t.get("readingId").equals(Long.toString(l.readingId()))||!Objects.equals(t.get("movementId"),l.movementId()==null?null:l.movementId().toString())||l.systemGallons()==null||((BigDecimal)t.get("systemGallons")).compareTo(l.systemGallons())!=0)throw conflict("Tank gallons changed. Reopen the adjustment and confirm the actual gallons again");
   gallons(l.systemGallons());gallons(l.actualGallons());if(l.actualGallons().compareTo((BigDecimal)t.get("capacity"))>0)throw bad("Actual gallons exceed tank capacity");if(l.actualGallons().compareTo(l.systemGallons())==0)throw bad("Actual and system gallons match; no adjustment is needed");
   if(!Set.of("meter_variance","evaporation","leak","theft","calibration","other").contains(l.reason()==null?"":l.reason()))throw bad("Select an adjustment reason");
  }
 }
 private void saveLines(String store,long id,Input in){a.db.update("UPDATE fuel_adjustment_lines SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND adjustment_id=? AND dgt_id=?",id,store);for(var l:in.lines())a.db.update("INSERT INTO fuel_adjustment_lines(adjustment_id,dgt_id,tank_id,fuel_grade_id,system_gallons,actual_gallons,baseline_reading_id,baseline_movement_id,reason) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(adjustment_id,tank_id) DO UPDATE SET fuel_grade_id=EXCLUDED.fuel_grade_id,system_gallons=EXCLUDED.system_gallons,actual_gallons=EXCLUDED.actual_gallons,baseline_reading_id=EXCLUDED.baseline_reading_id,baseline_movement_id=EXCLUDED.baseline_movement_id,reason=EXCLUDED.reason,archived_at=NULL",id,store,l.tankId(),l.gradeId(),l.systemGallons(),l.actualGallons(),l.readingId(),l.movementId(),l.reason());}
 private Map<String,Object> locked(String store,long id){var rs=a.db.queryForList("SELECT *,xmin::text AS version FROM fuel_adjustments WHERE dgt_id=? AND adjustment_id=? FOR UPDATE",store,id);if(rs.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Adjustment not found in this store");return rs.getFirst();}
 private void version(Map<String,Object> row,String version){if(!Objects.equals(row.get("version"),version))throw conflict("Adjustment changed; reopen the latest record");}
 private void audit(String store,String event,long id){a.audit(store,event,Long.toString(id),json.writeValueAsString(detail(store,id)));}
 @PostMapping @Transactional
 public Object create(@PathVariable String store,@RequestHeader("Idempotency-Key") UUID key,@RequestBody Input in){
  access(store,EDIT);lock(store);access(store,EDIT);String hash;try{hash=HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(json.writeValueAsString(in).getBytes(java.nio.charset.StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}
  var prior=a.db.queryForList("SELECT adjustment_id,request_hash FROM fuel_adjustments WHERE dgt_id=? AND client_request_id=?",store,key);if(!prior.isEmpty()){if(!hash.equals(prior.getFirst().get("request_hash")))throw conflict("Save request already used for different details");return detail(store,((Number)prior.getFirst().get("adjustment_id")).longValue());}
  validate(store,in);Long id=a.db.queryForObject("INSERT INTO fuel_adjustments(dgt_id,client_request_id,request_hash,adjustment_date,notes,created_by) VALUES (?,?,?,?,?,?) RETURNING adjustment_id",Long.class,store,key,hash,in.date(),text(in.notes(),5000),a.user());saveLines(store,id,in);audit(store,"GAS_ADJUSTMENT_CREATED",id);if(in.submit())submit(store,id);return detail(store,id);
 }
 @PutMapping("/{id}") @Transactional
 public Object update(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestBody Input in){access(store,EDIT);lock(store);access(store,EDIT);var row=locked(store,id);version(row,version);if(!Set.of("DRAFT","PENDING").contains(row.get("status")))throw conflict("Completed adjustments cannot be edited");if(((Number)row.get("created_by")).longValue()!=a.user()&&!allowed(store,APPROVE))throw a.denied();validate(store,in);saveLines(store,id,in);a.db.update("UPDATE fuel_adjustments SET adjustment_date=?,notes=?,status='DRAFT',updated_at=clock_timestamp() WHERE adjustment_id=?",in.date(),text(in.notes(),5000),id);audit(store,"GAS_ADJUSTMENT_UPDATED",id);if(in.submit())submit(store,id);return detail(store,id);}
 private void submit(String store,long id){a.db.update("UPDATE fuel_adjustments SET status='PENDING',updated_at=clock_timestamp() WHERE adjustment_id=?",id);audit(store,"GAS_ADJUSTMENT_SUBMITTED",id);if(admin(store))post(store,id);}
 private void post(String store,long id){
  var row=locked(store,id);var ls=lines(store,id);var input=new ArrayList<Line>();for(var l:ls)input.add(new Line(Long.parseLong(l.get("tankId").toString()),Long.parseLong(l.get("gradeId").toString()),new BigDecimal(l.get("systemGallons").toString()),new BigDecimal(l.get("actualGallons").toString()),Long.parseLong(l.get("readingId").toString()),l.get("movementId")==null?null:Long.parseLong(l.get("movementId").toString()),(String)l.get("reason")));
  // A pending request must be reconfirmed when its date or baseline becomes stale.
  validate(store,new Input(((java.sql.Date)row.get("adjustment_date")).toLocalDate(),(String)row.get("notes"),input,true));
  for(var l:ls)a.db.update("INSERT INTO inventory_movements(dgt_id,product_id,movement_type,qty_changed,unit_cost,reference_id,tank_id,fuel_grade_id,fuel_adjustment_line_id,created_at) VALUES (?,NULL,'FUEL_ADJUSTMENT',?,NULL,?,?,?,?,clock_timestamp())",store,new BigDecimal(l.get("difference").toString()),id,Long.parseLong(l.get("tankId").toString()),Long.parseLong(l.get("gradeId").toString()),Long.parseLong(l.get("id").toString()));
  a.db.update("UPDATE fuel_adjustments SET status='POSTED',reviewed_by=?,reviewed_at=clock_timestamp(),updated_at=clock_timestamp() WHERE adjustment_id=?",a.user(),id);audit(store,"GAS_ADJUSTMENT_POSTED",id);
 }
 @PostMapping("/{id}/{action:approve|reject}") @Transactional
 public Object decide(@PathVariable String store,@PathVariable long id,@PathVariable String action,@RequestHeader("If-Match") String version,@RequestBody(required=false) Decision in){access(store,APPROVE);lock(store);access(store,APPROVE);var row=locked(store,id);if(((Number)row.get("created_by")).longValue()==a.user()&&!admin(store))throw a.denied();String target=action.equals("approve")?"POSTED":"REJECTED";if(target.equals(row.get("status")))return detail(store,id);version(row,version);if(!"PENDING".equals(row.get("status")))throw conflict("Only pending adjustments can be reviewed");if(action.equals("approve"))post(store,id);else{String reason=text(in==null?null:in.reason(),1000);if(reason.isEmpty())throw bad("Enter a rejection reason");a.db.update("UPDATE fuel_adjustments SET status='REJECTED',reviewed_by=?,reviewed_at=clock_timestamp(),rejection_reason=?,updated_at=clock_timestamp() WHERE adjustment_id=?",a.user(),reason,id);audit(store,"GAS_ADJUSTMENT_REJECTED",id);}return detail(store,id);}
}
