package com.dgt.backend.fuel.report;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@ConditionalOnProperty(name="app.gas.tank-report.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/gas-tank-report")
public class TankReportController {
 private final ScopedAccess a;
 public TankReportController(ScopedAccess a){this.a=a;}
 private void access(String store){
  if(a.admin(a.user(),a.company(store)))return;
  boolean allowed=Boolean.TRUE.equals(a.db.queryForObject("""
   SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id)
   JOIN store_role_permissions p ON p.dgt_id=r.dgt_id AND p.role_type_id=r.role_type_id
   WHERE r.dgt_id=? AND r.user_id=? AND r.is_active AND t.is_active AND p.allowed
   AND upper(t.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT')
   AND (p.permission_code IN ('GAS_VIEW_ADJUSTMENTS','GAS_RECORD_ADJUSTMENT')
   OR (upper(t.role_type_name)='MANAGER' AND p.permission_code IN ('GAS_APPROVE_ADJUSTMENT','GAS_SETTINGS'))))
   """,Boolean.class,store,a.user()));
  if(!allowed)throw a.denied();
 }
 private ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object report(@PathVariable String store,@RequestParam(required=false) LocalDate start,@RequestParam(required=false) LocalDate end,@RequestParam(required=false) Long grade){
  access(store);ZoneId zone;try{zone=ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));}catch(Exception ex){throw bad("Configure the store timezone first");}
  Instant now=a.db.queryForObject("SELECT statement_timestamp()",java.sql.Timestamp.class).toInstant();LocalDate today=now.atZone(zone).toLocalDate();if(end==null)end=today;if(start==null)start=end.minusDays(6);
  if(start.isAfter(end)||end.isAfter(today)||start.isBefore(LocalDate.of(1900,1,1))||ChronoUnit.DAYS.between(start,end)>365)throw bad("Choose a date range of up to 366 days ending today or earlier");
  var grades=a.db.queryForList("""
   SELECT DISTINCT g.fuel_grade_id::text AS id,g.grade_name AS name FROM fuel_grades g
   JOIN fuel_tank_grade_assignments x USING(fuel_grade_id) JOIN fuel_tanks t USING(tank_id)
   WHERE t.dgt_id=? ORDER BY name,id
   """,store);
  if(grade!=null&&grades.stream().noneMatch(g->g.get("id").equals(grade.toString())))throw bad("Fuel grade is not assigned to a tank in this store");
  var rows=a.db.queryForList("""
   WITH days AS (SELECT (?::date+i)::date AS day FROM generate_series(0,?::date-?::date) i),
   periods AS (SELECT day,day::timestamp AT TIME ZONE ? AS begins,
     least((day+1)::timestamp AT TIME ZONE ?,?::timestamptz) AS ends FROM days)
   SELECT p.day AS date,t.tank_id::text AS "tankId",t.tank_number AS tank,
    CASE WHEN gr.n=1 THEN gr.id::text ELSE NULL END AS "gradeId",
    CASE WHEN gr.n=1 THEN gr.name ELSE 'Unassigned / overlapping grades' END AS "gradeName",
    opening.volume_gallons+om.qty AS open,coalesce(m.delivered,0) AS purchase,
    coalesce(m.adjusted,0) AS adjustments,closing.volume_gallons+cm.qty AS close,
    measured.volume_gallons AS "stVol",measured.reading_datetime AS "measuredAt",
    closing.reading_datetime AS "baselineAt"
   FROM periods p CROSS JOIN fuel_tanks t
   LEFT JOIN LATERAL (SELECT count(*) AS n,min(g.fuel_grade_id) AS id,min(g.grade_name) AS name
     FROM fuel_tank_grade_assignments x JOIN fuel_grades g USING(fuel_grade_id)
     WHERE x.tank_id=t.tank_id AND x.effective_from<=p.day AND (x.effective_to IS NULL OR x.effective_to>=p.day)) gr ON true
   LEFT JOIN LATERAL (SELECT volume_gallons,reading_datetime FROM fuel_tank_readings
     WHERE tank_id=t.tank_id AND reading_datetime<p.begins ORDER BY reading_datetime DESC,tank_reading_id DESC LIMIT 1) opening ON true
   LEFT JOIN LATERAL (SELECT coalesce(sum(qty_changed),0) AS qty FROM inventory_movements
     WHERE dgt_id=t.dgt_id AND tank_id=t.tank_id AND created_at>opening.reading_datetime AND created_at<p.begins) om ON true
   LEFT JOIN LATERAL (SELECT volume_gallons,reading_datetime FROM fuel_tank_readings
     WHERE tank_id=t.tank_id AND reading_datetime<p.ends ORDER BY reading_datetime DESC,tank_reading_id DESC LIMIT 1) closing ON true
   LEFT JOIN LATERAL (SELECT coalesce(sum(qty_changed),0) AS qty FROM inventory_movements
     WHERE dgt_id=t.dgt_id AND tank_id=t.tank_id AND created_at>closing.reading_datetime AND created_at<p.ends) cm ON true
   LEFT JOIN LATERAL (SELECT
     sum(qty_changed) FILTER(WHERE movement_type='FUEL_DELIVERY') AS delivered,
     sum(qty_changed) FILTER(WHERE movement_type='FUEL_ADJUSTMENT') AS adjusted
     FROM inventory_movements WHERE dgt_id=t.dgt_id AND tank_id=t.tank_id AND created_at>=p.begins AND created_at<p.ends) m ON true
   LEFT JOIN LATERAL (SELECT volume_gallons,reading_datetime FROM fuel_tank_readings
     WHERE tank_id=t.tank_id AND reading_datetime>=p.begins AND reading_datetime<p.ends
     ORDER BY reading_datetime DESC,tank_reading_id DESC LIMIT 1) measured ON true
   WHERE t.dgt_id=? AND t.created_at<p.ends AND (?::bigint IS NULL OR (gr.n=1 AND gr.id=?))
   ORDER BY p.day,t.tank_number,t.tank_id
   """,start,end,start,zone.getId(),zone.getId(),java.sql.Timestamp.from(now),store,grade,grade);
  // Unsupported observations remain null, including sales (not an assumed zero).
  for(var r:rows){r.put("sold",null);r.put("stInches",null);r.put("os",null);}
  var summaries=new LinkedHashMap<String,Map<String,Object>>();
  for(var row:rows){String id=(String)row.get("tankId");var s=summaries.get(id);if(s==null){s=new LinkedHashMap<>();s.put("tankId",id);s.put("tank",row.get("tank"));s.put("open",row.get("open"));s.put("purchase",BigDecimal.ZERO);s.put("adjustments",BigDecimal.ZERO);s.put("sold",null);s.put("os",null);s.put("stVol",null);s.put("measuredAt",null);s.put("gradeName",row.get("gradeName"));summaries.put(id,s);}if(!Objects.equals(s.get("gradeName"),row.get("gradeName")))s.put("gradeName","Multiple grades in period");s.put("close",row.get("close"));s.put("purchase",((BigDecimal)s.get("purchase")).add((BigDecimal)row.get("purchase")));s.put("adjustments",((BigDecimal)s.get("adjustments")).add((BigDecimal)row.get("adjustments")));if(row.get("stVol")!=null){s.put("stVol",row.get("stVol"));s.put("measuredAt",row.get("measuredAt"));}}
  return Map.of("start",start.toString(),"end",end.toString(),"today",today.toString(),"timezone",zone.getId(),"asOf",now.toString(),"grades",grades,"rows",rows.stream().map(Rows::normalize).toList(),"summary",summaries.values().stream().map(Rows::normalize).toList());
 }
}
