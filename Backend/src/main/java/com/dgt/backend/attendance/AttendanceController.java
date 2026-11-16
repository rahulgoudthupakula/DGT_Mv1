package com.dgt.backend.attendance;
import com.dgt.backend.access.security.*;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.*;import java.math.*;import java.util.*;import java.sql.Timestamp;

@RestController @RequestMapping("/api/v1/access/stores/{store}/attendance")
@ConditionalOnProperty(name="app.workweek.enabled",havingValue="true")
public class AttendanceController {
 private final ScopedAccess a;private final PagePermissions pages;
 public AttendanceController(ScopedAccess a,PagePermissions pages){this.a=a;this.pages=pages;}
 private boolean admin(String store){return a.admin(a.user(),a.company(store));}
 private boolean supervisor(String store){return admin(store)||Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.user_id=? AND r.dgt_id=? AND public.role_access_active(r.is_active,r.access_ends_on,r.dgt_id) AND t.is_active AND upper(t.role_type_name) IN ('MANAGER','ACCOUNTANT'))",Boolean.class,a.user(),store));}
 private Instant instant(Object value){return value==null?null:((Timestamp)value).toInstant();}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private Map<String,Object> setting(String store){var rows=a.db.queryForList("SELECT weekly_overtime_hours AS threshold,xmin::text AS version FROM store_attendance_settings WHERE dgt_id=?",store);return rows.isEmpty()?Map.of("threshold",new BigDecimal("40.00"),"version","0"):Rows.normalize(rows.getFirst());}
 @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object summary(@PathVariable String store,@RequestParam(required=false) LocalDate week){return read(store,week,null);}
 @GetMapping("/{employee}") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
 public Object detail(@PathVariable String store,@PathVariable long employee,@RequestParam(required=false) LocalDate week){return read(store,week,employee);}
 private Object read(String store,LocalDate week,Long employee){
  pages.requireAny(store,"WORKWEEK_PAGE_TIME_ATTENDANCE");ZoneId zone=ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));
  LocalDate today=LocalDate.now(zone);week=AttendanceMath.sunday(week==null?today:week);
  if(week.isBefore(LocalDate.of(2000,1,1))||week.isAfter(today.plusYears(1)))throw bad("Choose a supported attendance week");
  Instant lower=week.atStartOfDay(zone).toInstant(),upper=week.plusWeeks(1).atStartOfDay(zone).toInstant();var config=setting(store);BigDecimal threshold=new BigDecimal(config.get("threshold").toString());boolean all=supervisor(store);
  var employees=a.db.queryForList("SELECT DISTINCT e.employee_id AS id,coalesce(u.first_name,e.first_name,'')||' '||coalesce(u.last_name,e.last_name,'') AS name FROM employees e LEFT JOIN users u ON u.user_id=e.user_id JOIN employee_store_assignments s ON s.employee_id=e.employee_id WHERE s.dgt_id=? AND (? OR e.user_id=?) AND (s.effective_from<=? AND (s.effective_to IS NULL OR s.effective_to>=?) OR EXISTS(SELECT 1 FROM employee_time_entries te WHERE te.employee_id=e.employee_id AND te.dgt_id=s.dgt_id AND te.clock_in<? AND (te.clock_out IS NULL OR te.clock_out>?))) ORDER BY name,id",store,all,a.user(),week.plusDays(6),week,Timestamp.from(upper),Timestamp.from(lower));
  if(employee!=null&&employees.stream().noneMatch(row->((Number)row.get("id")).longValue()==employee))throw a.denied();
  var entries=a.db.queryForList("SELECT time_entry_id AS id,employee_id,clock_in,clock_out,event_type,source_system,source_entry_id FROM employee_time_entries WHERE dgt_id=? AND clock_in<? AND (clock_out IS NULL OR clock_out>?) ORDER BY employee_id,clock_in,time_entry_id",store,Timestamp.from(upper),Timestamp.from(lower));
  var shifts=a.db.queryForList("SELECT employee_id,schedule_start,schedule_end FROM employee_schedules WHERE dgt_id=? AND status='PUBLISHED' AND schedule_start<? AND schedule_end>? ORDER BY schedule_start",store,Timestamp.from(upper),Timestamp.from(lower));
  var leave=a.db.queryForList("SELECT r.employee_id,l.start_at,l.end_at FROM workforce_leave_shifts l JOIN workforce_requests r ON r.request_id=l.request_id WHERE r.dgt_id=? AND r.kind='TIME_OFF' AND r.status='APPROVED' AND l.start_at<? AND l.end_at>?",store,Timestamp.from(upper),Timestamp.from(lower));
  var summaries=new ArrayList<Map<String,Object>>();var punches=new ArrayList<Map<String,Object>>();
  for(var person:employees){
   long id=((Number)person.get("id")).longValue();if(employee!=null&&id!=employee)continue;
   long worked=0,ot=0,scheduled=0,timeOff=0;int open=0,missing=0;
   for(var row:entries)if(((Number)row.get("employee_id")).longValue()==id){Instant start=instant(row.get("clock_in")),end=instant(row.get("clock_out"));long seconds=AttendanceMath.seconds(start,end,lower,upper),entryOt=AttendanceMath.overtime(worked,seconds,threshold);worked+=seconds;ot+=entryOt;if(end==null)open++;
    if(employee!=null){var punch=new LinkedHashMap<String,Object>();punch.put("id",row.get("id"));punch.put("clockIn",start.toString());punch.put("clockOut",end==null?null:end.toString());punch.put("worked",end==null?null:AttendanceMath.hours(seconds));punch.put("overtime",AttendanceMath.hours(entryOt));punch.put("source",row.get("source_system")==null?row.get("event_type"):row.get("source_system"));punches.add(punch);}
   }
   for(var row:shifts)if(((Number)row.get("employee_id")).longValue()==id){Instant start=instant(row.get("schedule_start")),end=instant(row.get("schedule_end"));scheduled+=AttendanceMath.seconds(start,end,lower,upper);
    if(end.isBefore(Instant.now())&&entries.stream().noneMatch(p->((Number)p.get("employee_id")).longValue()==id&&instant(p.get("clock_in")).isBefore(end)&&(p.get("clock_out")==null||instant(p.get("clock_out")).isAfter(start))))missing++;
   }
   for(var row:leave)if(((Number)row.get("employee_id")).longValue()==id)timeOff+=AttendanceMath.seconds(instant(row.get("start_at")),instant(row.get("end_at")),lower,upper);
   summaries.add(Map.of("id",id,"name",person.get("name"),"scheduled",AttendanceMath.hours(scheduled),"worked",AttendanceMath.hours(worked),"regular",AttendanceMath.hours(worked-ot),"overtime",AttendanceMath.hours(ot),"timeOff",AttendanceMath.hours(timeOff),"openPunches",open,"unmatchedShifts",missing));
  }
  var result=new LinkedHashMap<String,Object>();result.put("week",week.toString());result.put("timezone",zone.toString());result.put("settings",config);result.put("canConfigure",admin(store));result.put("employees",summaries);if(employee!=null)result.put("punches",punches);return result;
 }
 @tools.jackson.databind.annotation.JsonNaming(tools.jackson.databind.PropertyNamingStrategies.LowerCamelCaseStrategy.class)
 public record Settings(BigDecimal weeklyOvertimeHours,String version){}
 @PutMapping("/settings") @Transactional public Object settings(@PathVariable String store,@RequestBody Settings input){pages.requireAny(store,"WORKWEEK_PAGE_TIME_ATTENDANCE");a.requireAdmin(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
  if(input.weeklyOvertimeHours()==null||input.weeklyOvertimeHours().scale()>2||input.weeklyOvertimeHours().signum()<=0||input.weeklyOvertimeHours().compareTo(new BigDecimal("168"))>0)throw bad("Use a weekly overtime threshold between 0.01 and 168 hours");
  if(!Objects.equals(input.version(),setting(store).get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Attendance settings changed. Refresh before saving.");
  a.db.update("INSERT INTO store_attendance_settings(dgt_id,weekly_overtime_hours,updated_by) VALUES (?,?,?) ON CONFLICT(dgt_id) DO UPDATE SET weekly_overtime_hours=excluded.weekly_overtime_hours,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP",store,input.weeklyOvertimeHours(),a.user());a.audit(store,"ATTENDANCE_SETTINGS_UPDATED",store,"{}");return Map.of("success",true);
 }
}
