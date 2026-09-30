package com.dgt.backend.workforce;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import java.time.*;
import java.math.BigDecimal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@ConditionalOnProperty(name="app.workforce.enabled",havingValue="true")
public class WorkforceService {
 @org.springframework.beans.factory.annotation.Value("${app.workforce.shift-changes.enabled:false}")
 private boolean shiftChangesEnabled;
 private final ScopedAccess a;
 private final ObjectMapper json;
 public WorkforceService(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 private ResponseStatusException conflict(String m){return new ResponseStatusException(HttpStatus.CONFLICT,m);}
 private long number(Object v){return ((Number)v).longValue();}
 private LocalDate date(Object v){return ((java.sql.Date)v).toLocalDate();}
 private Instant instant(Object v){return ((java.sql.Timestamp)v).toInstant();}
 private ZoneId zone(String store){String z=a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store);if(z==null)throw bad("Store timezone is required");return ZoneId.of(z);}
 public LocalDate today(String store){return LocalDate.now(zone(store));}
 private void lock(String store){a.assigned(store);a.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",a.company(store));a.assigned(store);}
 public boolean manager(String store){if(a.admin(a.user(),a.company(store)))return true;return Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN role_types rt USING(role_type_id) WHERE ur.user_id=? AND ur.dgt_id=? AND ur.is_active AND rt.is_active AND upper(rt.role_type_name)='MANAGER')",Boolean.class,a.user(),store));}
 private void manage(String store){a.assigned(store);if(!manager(store))throw a.denied();}
 private Map<String,Object> employee(String store,long id){var rows=a.db.queryForList("SELECT e.* FROM employees e WHERE e.employee_id=? AND EXISTS(SELECT 1 FROM employee_store_assignments es WHERE es.employee_id=e.employee_id AND es.dgt_id=?)",id,store);if(rows.size()!=1)throw a.denied();return rows.getFirst();}
 private boolean own(String store,long id){var u=employee(store,id).get("user_id");return u!=null&&number(u)==a.user();}
 private void subject(String store,long id){a.assigned(store);employee(store,id);if(!manager(store)&&!own(store,id))throw a.denied();}
 private void employed(String store,long id,LocalDate from,LocalDate to){employee(store,id);if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM employee_store_assignments es JOIN employees e USING(employee_id) WHERE es.employee_id=? AND es.dgt_id=? AND es.effective_from<=? AND (es.effective_to IS NULL OR es.effective_to>=?) AND e.hire_date<=? AND (e.termination_date IS NULL OR e.termination_date>?))",Boolean.class,id,store,from,to,from,to)))throw bad("Employee is not actively assigned for these dates");}
 private boolean senior(String store,long id){var e=employee(store,id);Object uid=e.get("user_id");if(uid!=null&&a.admin(number(uid),a.company(store)))return true;return Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM employee_store_assignments es JOIN role_types rt USING(role_type_id) WHERE es.employee_id=? AND es.dgt_id=? AND rt.role_type_name IN ('ADMIN','MANAGER')) OR EXISTS(SELECT 1 FROM user_roles ur JOIN role_types rt USING(role_type_id) WHERE ur.user_id=? AND ur.dgt_id=? AND ur.is_active AND rt.role_type_name='MANAGER')",Boolean.class,id,store,uid,store));}
 private boolean reviewer(String store,Map<String,Object> r){if(a.admin(a.user(),a.company(store)))return true;if(!manager(store)||number(r.get("submitted_by"))==a.user()||own(store,number(r.get("employee_id"))))return false;Object target=r.get("target_employee_id");if(target!=null&&own(store,number(target)))return false;boolean needsAdmin=senior(store,number(r.get("employee_id")))||(target!=null&&senior(store,number(target)));return !needsAdmin||a.admin(a.user(),a.company(store));}
 private Map<String,Object> shift(String store,long id){var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM employee_schedules WHERE schedule_id=? AND dgt_id=?",id,store);if(rows.size()!=1)throw a.denied();return rows.getFirst();}
 private void future(Map<String,Object> s){if(!instant(s.get("schedule_start")).isAfter(Instant.now()))throw bad("Started shifts cannot be changed here");}
 private OffsetDateTime local(String store,LocalDateTime value,String offset){if(value==null)throw bad("Shift start and end are required");var offsets=zone(store).getRules().getValidOffsets(value);if(offsets.isEmpty())throw bad("This local time does not exist because of daylight saving time");if(offset==null||offset.isBlank()){if(offsets.size()!=1)throw bad("This local time occurs twice; select its UTC offset");return value.atOffset(offsets.getFirst());}try{var chosen=ZoneOffset.of(offset);if(!offsets.contains(chosen))throw bad("UTC offset does not match this store's timezone");return value.atOffset(chosen);}catch(DateTimeException ex){throw bad("Invalid UTC offset");}}
 public record ShiftInput(Long employeeId,LocalDateTime start,LocalDateTime end,String startOffset,String endOffset,String jobTitle,String notes,String overrideReason,String status,String version){}
 private void bounded(String s,int max,String label){if(s!=null&&s.length()>max)throw bad(label+" is too long");}
 private String availabilityConflict(String store,long employee,OffsetDateTime start,OffsetDateTime end){
  // A date exception supersedes recurring availability for that date. Overnight availability may begin the previous day.
  var startLocal=start.atZoneSameInstant(zone(store)).toLocalDateTime();var endLocal=end.atZoneSameInstant(zone(store)).toLocalDateTime();boolean configured=false;
  for(LocalDate d=startLocal.toLocalDate().plusDays(1);!d.isAfter(endLocal.minusNanos(1).toLocalDate());d=d.plusDays(1)){
   var next=a.db.queryForList("SELECT * FROM workforce_availability WHERE dgt_id=? AND employee_id=? AND kind='EXCEPTION' AND start_date<=? AND end_date>=? ORDER BY availability_id DESC LIMIT 1",store,employee,d,d);
   if(!next.isEmpty()&&!covers(next.getFirst(),d,d.atStartOfDay(),endLocal.isBefore(d.plusDays(1).atStartOfDay())?endLocal:d.plusDays(1).atStartOfDay()))return "Outside approved date-specific availability";
  }
  var exception=a.db.queryForList("SELECT * FROM workforce_availability WHERE dgt_id=? AND employee_id=? AND kind='EXCEPTION' AND start_date<=? AND end_date>=? ORDER BY availability_id DESC LIMIT 1",store,employee,startLocal.toLocalDate(),startLocal.toLocalDate());
  if(!exception.isEmpty())return covers(exception.getFirst(),startLocal.toLocalDate(),startLocal,endLocal)?null:"Outside approved date-specific availability";
  for(LocalDate anchor:List.of(startLocal.toLocalDate(),startLocal.toLocalDate().minusDays(1))){
   var rows=a.db.queryForList("SELECT * FROM workforce_availability WHERE dgt_id=? AND employee_id=? AND kind='AVAILABILITY' AND weekday=? AND start_date<=? ORDER BY start_date DESC,availability_id DESC LIMIT 1",store,employee,anchor.getDayOfWeek().getValue(),anchor);
   if(!rows.isEmpty()){if(anchor.equals(startLocal.toLocalDate()))configured=true;if(covers(rows.getFirst(),anchor,startLocal,endLocal))return null;}
  }
  return configured?"Outside approved weekly availability":null;
 }
 private boolean covers(Map<String,Object> r,LocalDate anchor,LocalDateTime start,LocalDateTime end){if(Boolean.TRUE.equals(r.get("unavailable")))return false;LocalTime from=((java.sql.Time)r.get("start_time")).toLocalTime(),to=((java.sql.Time)r.get("end_time")).toLocalTime();LocalDateTime lo=anchor.atTime(from),hi=anchor.plusDays(Boolean.TRUE.equals(r.get("overnight"))?1:0).atTime(to);return !start.isBefore(lo)&&!end.isAfter(hi);}
 private void eligible(String store,long employee,OffsetDateTime start,OffsetDateTime end,Set<Long> excluding,String override){
  employed(store,employee,start.atZoneSameInstant(zone(store)).toLocalDate(),end.minusNanos(1).atZoneSameInstant(zone(store)).toLocalDate());
  a.db.queryForList("SELECT employee_id FROM employees WHERE employee_id=? FOR UPDATE",employee);
  for(var r:a.db.queryForList("SELECT schedule_id FROM employee_schedules WHERE employee_id=? AND status IN ('DRAFT','PUBLISHED') AND schedule_start<? AND schedule_end>?",employee,end,start))if(!excluding.contains(number(r.get("schedule_id"))))throw conflict("Employee already has an overlapping shift, possibly at another store");
  LocalDate workDate=start.atZoneSameInstant(zone(store)).toLocalDate();
  if(Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM workforce_requests WHERE dgt_id=? AND employee_id=? AND kind='TIME_OFF' AND status='APPROVED' AND (((payload->>'shiftId') IS NULL AND (payload->>'startDate')::date<=? AND (payload->>'endDate')::date>=?) OR EXISTS(SELECT 1 FROM workforce_leave_shifts ls WHERE ls.request_id=workforce_requests.request_id AND ls.start_at<? AND ls.end_at>?)))",Boolean.class,store,employee,workDate,workDate,end,start)))throw conflict("Employee has approved time off for this shift date");
  for(LocalDate d=start.atZoneSameInstant(zone(store)).toLocalDate();!d.isAfter(end.minusNanos(1).atZoneSameInstant(zone(store)).toLocalDate());d=d.plusDays(1)){
   var exception=a.db.queryForList("SELECT unavailable FROM workforce_availability WHERE dgt_id=? AND employee_id=? AND kind='EXCEPTION' AND start_date<=? AND end_date>=? ORDER BY availability_id DESC LIMIT 1",store,employee,d,d);
   if(!exception.isEmpty()&&Boolean.TRUE.equals(exception.getFirst().get("unavailable"))&&(override==null||override.isBlank()))throw conflict("Shift overlaps an unavailable date; manager override reason required");
  }
  String warning=availabilityConflict(store,employee,start,end);if(warning!=null&&(override==null||override.isBlank()))throw conflict(warning+"; a manager override reason is required");
 }
 @Transactional public Object saveShift(String store,Long id,ShiftInput in){log.info("Saving shift store={} id={}", store, id);lock(store);manage(store);if(in.employeeId()==null)throw bad("Choose an employee");OffsetDateTime start=local(store,in.start(),in.startOffset()),end=local(store,in.end(),in.endOffset());if(!end.isAfter(start)||Duration.between(start,end).compareTo(Duration.ofHours(26))>0)throw bad("Shift end must follow start, within 26 hours");if(!start.toInstant().isAfter(Instant.now()))throw bad("Create future shifts only");if(!Set.of("DRAFT","PUBLISHED").contains(in.status()==null?"":in.status()))throw bad("Choose Draft or Published");bounded(in.notes(),500,"Notes");bounded(in.jobTitle(),100,"Job title");bounded(in.overrideReason(),500,"Override reason");
  if(id!=null){var old=shift(store,id);future(old);if(!Objects.equals(in.version(),old.get("version")))throw conflict("Shift changed; reopen before saving");if(!Set.of("DRAFT","PUBLISHED").contains(old.get("status")))throw bad("Use coverage requests for a shift needing coverage");}
  eligible(store,in.employeeId(),start,end,id==null?Set.of():Set.of(id),in.overrideReason());
  if(id==null)id=a.db.queryForObject("INSERT INTO employee_schedules(employee_id,dgt_id,work_date,schedule_start,schedule_end,status,notes,created_by,job_title,override_reason,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,CASE WHEN ?='PUBLISHED' THEN CURRENT_TIMESTAMP ELSE NULL END) RETURNING schedule_id",Long.class,in.employeeId(),store,in.start().toLocalDate(),start,end,in.status(),in.notes(),a.user(),in.jobTitle(),in.overrideReason(),in.status());
  else a.db.update("UPDATE employee_schedules SET employee_id=?,work_date=?,schedule_start=?,schedule_end=?,status=?,notes=?,job_title=?,override_reason=?,published_at=CASE WHEN ?='PUBLISHED' THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE schedule_id=?",in.employeeId(),in.start().toLocalDate(),start,end,in.status(),in.notes(),in.jobTitle(),in.overrideReason(),in.status(),id);
  a.audit(store,"SHIFT_SAVED",id.toString(),"{}");return Map.of("id",id);
 }
 @Transactional public Object cancelShift(String store,long id,String version){log.info("Cancelling shift store={} id={}", store, id);lock(store);manage(store);var old=shift(store,id);future(old);if(!Objects.equals(version,old.get("version")))throw conflict("Shift changed");a.db.update("UPDATE employee_schedules SET status='CANCELLED',updated_at=CURRENT_TIMESTAMP WHERE schedule_id=?",id);a.audit(store,"SHIFT_CANCELLED",Long.toString(id),"{}");return Map.of("id",id);}
 public record WeekAction(LocalDate week,String action){}
 @Transactional public Object weekAction(String store,WeekAction in){lock(store);manage(store);if(in.week()==null||!Set.of("PUBLISH","COPY").contains(in.action()==null?"":in.action()))throw bad("Choose a week and action");
  var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM employee_schedules WHERE dgt_id=? AND work_date BETWEEN ? AND ? AND status IN ('DRAFT','PUBLISHED') ORDER BY schedule_start",store,in.week(),in.week().plusDays(6));int count=0;
  for(var s:rows){if(in.action().equals("PUBLISH")){if(!"DRAFT".equals(s.get("status")))continue;future(s);eligible(store,number(s.get("employee_id")),instant(s.get("schedule_start")).atOffset(ZoneOffset.UTC),instant(s.get("schedule_end")).atOffset(ZoneOffset.UTC),Set.of(number(s.get("schedule_id"))),(String)s.get("override_reason"));a.db.update("UPDATE employee_schedules SET status='PUBLISHED',published_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE schedule_id=?",s.get("schedule_id"));}
   else{var start=instant(s.get("schedule_start")).atZone(zone(store)).toLocalDateTime().plusWeeks(1);var end=instant(s.get("schedule_end")).atZone(zone(store)).toLocalDateTime().plusWeeks(1);saveShift(store,null,new ShiftInput(number(s.get("employee_id")),start,end,null,null,(String)s.get("job_title"),(String)s.get("notes"),null,"DRAFT",null));}count++;}
  a.audit(store,"WEEK_"+in.action(),in.week().toString(),"{}");return Map.of("count",count);
 }
 public record RequestInput(String kind,Long employeeId,LocalDate startDate,LocalDate endDate,Integer weekday,LocalTime startTime,LocalTime endTime,Boolean overnight,Boolean unavailable,String leaveType,String reason,Long shiftId,Long otherShiftId,Long targetEmployeeId){public RequestInput {overnight=Boolean.TRUE.equals(overnight);unavailable=Boolean.TRUE.equals(unavailable);}}
 private RequestInput payload(Map<String,Object> r){return json.readValue(r.get("payload").toString(),RequestInput.class);}
 private List<Map<String,Object>> affected(String store,RequestInput p){return a.db.queryForList("SELECT * FROM employee_schedules WHERE dgt_id=? AND employee_id=? AND work_date BETWEEN ? AND ? AND status IN ('PUBLISHED','NEEDS_COVERAGE') AND (?::bigint IS NULL OR schedule_id=?) ORDER BY schedule_start",store,p.employeeId(),p.startDate(),p.endDate(),p.shiftId(),p.shiftId());}
 private void interval(RequestInput p){if(p.startDate()==null||p.endDate()==null||p.endDate().isBefore(p.startDate())||p.endDate().isAfter(p.startDate().plusDays(365)))throw bad("Choose an ordered date range of at most one year");}
 private void published(Map<String,Object> s){future(s);if(!"PUBLISHED".equals(s.get("status")))throw bad("Select a published shift");}
 @Transactional public Object request(String store,RequestInput p,UUID key){log.info("Workforce request store={} kind={}", store, p.kind());lock(store);
  new com.dgt.backend.access.PagePermissions(a).requireAny(store,"TIME_OFF".equals(p.kind())?"WORKWEEK_PAGE_TIME_OFF_REQUEST":Set.of("AVAILABILITY","EXCEPTION").contains(p.kind()==null?"":p.kind())?"WORKWEEK_PAGE_WEEK_SCHEDULE_AVAILABILITY":"WORKWEEK_PAGE_WEEK_SCHEDULE_COVERAGE");if(p.employeeId()==null)throw bad("Choose an employee");subject(store,p.employeeId());if(!shiftChangesEnabled&&Set.of("COVER","SWAP").contains(p.kind()==null?"":p.kind()))throw bad("Coverage requests and shift swaps are off for now");bounded(p.reason(),500,"Reason");String encoded=json.writeValueAsString(p);
  var previous=a.db.queryForList("SELECT request_id,dgt_id,payload::text FROM workforce_requests WHERE submitted_by=? AND request_key=?",a.user(),key);if(!previous.isEmpty()){if(!store.equals(previous.getFirst().get("dgt_id"))||!json.readTree(previous.getFirst().get("payload").toString()).equals(json.readTree(encoded)))throw conflict("Request key already used");return result(number(previous.getFirst().get("request_id")));}
  if(!Set.of("AVAILABILITY","EXCEPTION","TIME_OFF","COVER","SWAP").contains(p.kind()==null?"":p.kind()))throw bad("Choose a request type");
  if(!p.kind().equals("SWAP")&&p.otherShiftId()!=null)throw bad("Only swaps take a second shift");
  if(!Set.of("COVER","SWAP").contains(p.kind())&&p.targetEmployeeId()!=null)throw bad("Only coverage requests take a recipient");
  if(Set.of("AVAILABILITY","EXCEPTION").contains(p.kind())&&p.shiftId()!=null)throw bad("Availability does not take a shift");
  Long target=p.targetEmployeeId(),leave=null;
  if(Set.of("AVAILABILITY","EXCEPTION","TIME_OFF").contains(p.kind())){
   interval(p);if(p.startDate().isBefore(today(store)))throw bad("Use today or future dates");employed(store,p.employeeId(),p.startDate(),p.endDate());
   if(!p.kind().equals("TIME_OFF")){
    if(p.kind().equals("AVAILABILITY")&&(p.weekday()==null||p.weekday()<1||p.weekday()>7))throw bad("Choose weekday");
    if(!p.unavailable()&&(p.startTime()==null||p.endTime()==null||(!p.overnight()&&!p.endTime().isAfter(p.startTime()))||(p.overnight()&&p.endTime().isAfter(p.startTime()))))throw bad("Choose availability times; overnight windows must be at most 24 hours");
   }else{
    if(!Set.of("Vacation","Sick Leave","Personal Day","Unpaid Leave","Other").contains(p.leaveType()==null?"":p.leaveType()))throw bad("Choose leave type");
    if(p.shiftId()!=null){var s=shift(store,p.shiftId());published(s);if(number(s.get("employee_id"))!=p.employeeId().longValue()||!date(s.get("work_date")).equals(p.startDate())||!p.startDate().equals(p.endDate()))throw bad("Shift leave must use its start date");}
    if(Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM workforce_requests WHERE dgt_id=? AND employee_id=? AND kind='TIME_OFF' AND status IN ('PENDING','APPROVED') AND (payload->>'startDate')::date<=? AND (payload->>'endDate')::date>=?)",Boolean.class,store,p.employeeId(),p.endDate(),p.startDate())))throw conflict("Overlapping leave request already exists");
    leave=a.db.queryForObject("INSERT INTO employee_time_off_requests(employee_id,request_type,start_date,end_date,reason,status_type_id,dgt_id,submitted_by) VALUES (?,?::jsonb,?,?,?,(SELECT status_type_id FROM status_types WHERE status_name='PENDING' ORDER BY status_type_id LIMIT 1),?,?) RETURNING time_off_request_id",Long.class,p.employeeId(),json.writeValueAsString(Map.of("type",p.leaveType())),p.startDate(),p.endDate(),p.reason()==null?"":p.reason(),store,a.user());
   }
  }else{
   if(p.shiftId()==null)throw bad("Choose the shift");var s=shift(store,p.shiftId());future(s);if(number(s.get("employee_id"))!=p.employeeId().longValue()||!Set.of("PUBLISHED","NEEDS_COVERAGE").contains(s.get("status")))throw bad("Choose your published shift or a shift needing coverage");
   if(p.kind().equals("SWAP")){published(s);if(p.otherShiftId()==null||p.otherShiftId().equals(p.shiftId()))throw bad("Choose another shift to swap");var other=shift(store,p.otherShiftId());published(other);target=number(other.get("employee_id"));if(target.equals(p.employeeId()))throw bad("Choose another employee's shift");}
   if(target!=null){employee(store,target);if(target.equals(p.employeeId()))throw bad("Coverage must be another employee");}
  }
  String shiftVersion=p.shiftId()==null?null:(String)shift(store,p.shiftId()).get("version");String otherVersion=p.otherShiftId()==null?null:(String)shift(store,p.otherShiftId()).get("version");
  Long id=a.db.queryForObject("INSERT INTO workforce_requests(dgt_id,employee_id,kind,payload,submitted_by,request_key,leave_id,target_employee_id,shift_version,other_shift_version) VALUES (?,?,?,?::jsonb,?,?,?,?,?,?) RETURNING request_id",Long.class,store,p.employeeId(),p.kind(),encoded,a.user(),key,leave,target,shiftVersion,otherVersion);
  a.audit(store,"WORKFORCE_REQUESTED",id.toString(),"{}");
  if(a.admin(a.user(),a.company(store))&&employee(store,p.employeeId()).get("user_id")!=null&&a.admin(number(employee(store,p.employeeId()).get("user_id")),a.company(store))){
   var r=a.db.queryForMap("SELECT * FROM workforce_requests WHERE request_id=?",id);
   if(Set.of("COVER","SWAP").contains(p.kind())){a.db.update("UPDATE workforce_requests SET reviewed_by=?,review_note='Admin authorized; awaiting recipient acceptance' WHERE request_id=?",a.user(),id);a.audit(store,"WORKFORCE_ADMIN_AUTHORIZED",id.toString(),"{}");}
   else approve(store,r,"Automatically approved by submitting admin",a.user());
  }
  return result(id);
 }
 public record Decision(String action,String version,String note,Long targetEmployeeId){}
 @Transactional public Object decide(String store,long id,Decision d){log.info("Workforce decision store={} requestId={} action={}", store, id, d.action());lock(store);bounded(d.note(),500,"Note");var matches=a.db.queryForList("SELECT *,xmin::text AS version FROM workforce_requests WHERE request_id=? AND dgt_id=? FOR UPDATE",id,store);if(matches.size()!=1)throw a.denied();var r=matches.getFirst();if(!Objects.equals(d.version(),r.get("version")))throw conflict("Request changed; refresh");if(!"PENDING".equals(r.get("status")))throw conflict("Request already decided");RequestInput p=payload(r);String action=d.action()==null?"":d.action();if(!shiftChangesEnabled&&Set.of("COVER","SWAP").contains(p.kind())&&!action.equals("CANCEL"))throw bad("Coverage requests and shift swaps are off for now");
  if((action.equals("ACCEPT")||action.equals("APPROVE"))&&p.shiftId()!=null){
   if(!Objects.equals(r.get("shift_version"),shift(store,p.shiftId()).get("version")))throw conflict("Shift changed since this request; cancel and submit again");
   if(p.otherShiftId()!=null&&!Objects.equals(r.get("other_shift_version"),shift(store,p.otherShiftId()).get("version")))throw conflict("Other shift changed since this request; cancel and submit again");
  }
  if(action.equals("DECLINE")){
   if(!Set.of("COVER","SWAP").contains(p.kind())||r.get("target_employee_id")==null)throw bad("Only a selected recipient can decline");long target=number(r.get("target_employee_id"));subject(store,target);if(d.note()==null||d.note().isBlank())throw bad("Explain the decline");finish(store,r,"REJECTED",d.note());return Map.of("id",id);
  }
  if(action.equals("ACCEPT")){
   if(r.get("accepted_by")!=null)throw conflict("Recipient already accepted");
   if(!Set.of("COVER","SWAP").contains(p.kind()))throw bad("Only coverage/swap recipients accept");Long target=(Long)r.get("target_employee_id");if(target==null)target=d.targetEmployeeId();if(target==null||target.equals(p.employeeId()))throw bad("Choose replacement employee");subject(store,target);if(!own(store,target)&&(d.note()==null||d.note().isBlank()))throw bad("Record employee consent when accepting on their behalf");
   var s=shift(store,p.shiftId());future(s);eligible(store,target,instant(s.get("schedule_start")).atOffset(ZoneOffset.UTC),instant(s.get("schedule_end")).atOffset(ZoneOffset.UTC),p.otherShiftId()==null?Set.of(p.shiftId()):Set.of(p.shiftId(),p.otherShiftId()),null);
   a.db.update("UPDATE workforce_requests SET accepted_by=?,target_employee_id=?,review_note=?,updated_at=CURRENT_TIMESTAMP WHERE request_id=?",a.user(),target,d.note(),id);a.audit(store,"WORKFORCE_ACCEPTED",Long.toString(id),"{}");
   if(r.get("reviewed_by")!=null&&number(r.get("reviewed_by"))==number(r.get("submitted_by"))&&a.admin(number(r.get("submitted_by")),a.company(store))){r.put("accepted_by",a.user());r.put("target_employee_id",target);approve(store,r,"Automatically approved after recipient acceptance",number(r.get("submitted_by")));}
   return result(id);
  }
  if(action.equals("CANCEL")){if(number(r.get("submitted_by"))!=a.user()&&!own(store,p.employeeId()))throw a.denied();finish(store,r,"CANCELLED",d.note());return Map.of("id",id);}
  if(!Set.of("APPROVE","REJECT").contains(action))throw bad("Unknown decision");if(!reviewer(store,r))throw a.denied();if(action.equals("REJECT")){if(d.note()==null||d.note().isBlank())throw bad("Explain rejection");finish(store,r,"REJECTED",d.note());return Map.of("id",id);}
  approve(store,r,d.note(),a.user());return result(id);
 }
 private Object result(long id){return Map.of("id",id,"status",a.db.queryForObject("SELECT status FROM workforce_requests WHERE request_id=?",String.class,id));}
 private void approve(String store,Map<String,Object> r,String note,long approver){long id=number(r.get("request_id"));RequestInput p=payload(r);
  if(Set.of("AVAILABILITY","EXCEPTION").contains(p.kind())){
   a.db.update("INSERT INTO workforce_availability(dgt_id,employee_id,kind,start_date,end_date,weekday,start_time,end_time,overnight,unavailable,request_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)",store,p.employeeId(),p.kind(),p.startDate(),p.kind().equals("AVAILABILITY")?null:p.endDate(),p.weekday(),p.startTime(),p.endTime(),p.overnight(),p.unavailable(),id);
  }else if(p.kind().equals("TIME_OFF")){
   for(var s:affected(store,p)){future(s);a.db.update("INSERT INTO workforce_leave_shifts(request_id,schedule_id,employee_id,work_date,start_at,end_at) VALUES (?,?,?,?,?,?)",id,s.get("schedule_id"),p.employeeId(),s.get("work_date"),s.get("schedule_start"),s.get("schedule_end"));a.db.update("UPDATE employee_schedules SET status='NEEDS_COVERAGE',updated_at=CURRENT_TIMESTAMP WHERE schedule_id=?",s.get("schedule_id"));}
  }else{
   if(r.get("accepted_by")==null||r.get("target_employee_id")==null)throw bad("Replacement employee must accept first");long target=number(r.get("target_employee_id"));var s=shift(store,p.shiftId());future(s);if(number(s.get("employee_id"))!=p.employeeId().longValue()||!Set.of("PUBLISHED","NEEDS_COVERAGE").contains(s.get("status")))throw conflict("Original shift changed; submit a new request");
   Set<Long> excluded=p.otherShiftId()==null?Set.of(p.shiftId()):Set.of(p.shiftId(),p.otherShiftId());eligible(store,target,instant(s.get("schedule_start")).atOffset(ZoneOffset.UTC),instant(s.get("schedule_end")).atOffset(ZoneOffset.UTC),excluded,null);
   if(p.kind().equals("SWAP")){var other=shift(store,p.otherShiftId());published(other);if(number(other.get("employee_id"))!=target)throw conflict("Swap shift changed");eligible(store,p.employeeId(),instant(other.get("schedule_start")).atOffset(ZoneOffset.UTC),instant(other.get("schedule_end")).atOffset(ZoneOffset.UTC),excluded,null);a.db.update("UPDATE employee_schedules SET employee_id=?,updated_at=CURRENT_TIMESTAMP WHERE schedule_id=?",p.employeeId(),p.otherShiftId());}
   a.db.update("UPDATE employee_schedules SET employee_id=?,status='PUBLISHED',updated_at=CURRENT_TIMESTAMP WHERE schedule_id=?",target,p.shiftId());
  }
  finish(store,r,"APPROVED",note,approver);
 }
 private void finish(String store,Map<String,Object> r,String status,String note){finish(store,r,status,note,a.user());}
 private void finish(String store,Map<String,Object> r,String status,String note,long approver){long id=number(r.get("request_id"));a.db.update("UPDATE workforce_requests SET status=?,reviewed_by=?,review_note=?,updated_at=CURRENT_TIMESTAMP WHERE request_id=?",status,approver,note,id);
  if(r.get("leave_id")!=null)a.db.update("UPDATE employee_time_off_requests SET status_type_id=(SELECT status_type_id FROM status_types WHERE status_name=? ORDER BY status_type_id LIMIT 1),reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,rejected_reason=?,hours_requested=(SELECT CASE WHEN count(*)=0 THEN NULL ELSE sum(extract(epoch FROM(end_at-start_at)))/3600 END FROM workforce_leave_shifts WHERE request_id=?),updated_at=CURRENT_TIMESTAMP WHERE time_off_request_id=?",status,approver,note,id,r.get("leave_id"));
  a.audit(store,"WORKFORCE_"+status,Long.toString(id),"{}");
 }
 private String availabilityConflictInMemory(List<Map<String,Object>> avail,LocalDateTime startLocal,LocalDateTime endLocal){
  boolean configured=false;
  for(LocalDate d=startLocal.toLocalDate().plusDays(1);!d.isAfter(endLocal.minusNanos(1).toLocalDate());d=d.plusDays(1)){final LocalDate fd=d;var next=avail.stream().filter(r->"EXCEPTION".equals(r.get("kind"))&&!date(r.get("start_date")).isAfter(fd)&&!date(r.get("end_date")).isBefore(fd)).max(Comparator.comparingLong(r->number(r.get("availability_id"))));if(next.isPresent()){LocalDateTime dayEnd=endLocal.isBefore(fd.plusDays(1).atStartOfDay())?endLocal:fd.plusDays(1).atStartOfDay();if(!covers(next.get(),fd,fd.atStartOfDay(),dayEnd))return "Outside approved date-specific availability";}}
  LocalDate startDate=startLocal.toLocalDate();var exception=avail.stream().filter(r->"EXCEPTION".equals(r.get("kind"))&&!date(r.get("start_date")).isAfter(startDate)&&!date(r.get("end_date")).isBefore(startDate)).max(Comparator.comparingLong(r->number(r.get("availability_id"))));
  if(exception.isPresent())return covers(exception.get(),startDate,startLocal,endLocal)?null:"Outside approved date-specific availability";
  for(LocalDate anchor:List.of(startDate,startDate.minusDays(1))){int weekday=anchor.getDayOfWeek().getValue();var row=avail.stream().filter(r->"AVAILABILITY".equals(r.get("kind"))&&((Number)r.get("weekday")).intValue()==weekday&&!date(r.get("start_date")).isAfter(anchor)).max(Comparator.<Map<String,Object>,LocalDate>comparing(r->date(r.get("start_date"))).thenComparingLong(r->number(r.get("availability_id"))));if(row.isPresent()){if(anchor.equals(startDate))configured=true;if(covers(row.get(),anchor,startLocal,endLocal))return null;}}
  return configured?"Outside approved weekly availability":null;
 }
 public Object read(String store,LocalDate week){log.debug("Reading workforce schedule store={} week={}", store, week);a.assigned(store);boolean manager=manager(store);ZoneId tz=zone(store);if(week==null)week=LocalDate.now(tz).with(java.time.DayOfWeek.MONDAY);long uid=a.user();
  LocalDate weekEnd=week.plusDays(6);
  var employees=a.db.queryForList("SELECT DISTINCT e.employee_id,coalesce(u.first_name,e.first_name)||' '||coalesce(u.last_name,e.last_name) AS name,coalesce(esa.job_title,'') AS job_title,(e.user_id=?) AS own FROM employees e JOIN employee_store_assignments esa ON esa.employee_id=e.employee_id LEFT JOIN users u ON u.user_id=e.user_id WHERE esa.dgt_id=? ORDER BY name",uid,store);
  var shiftRows=a.db.queryForList("SELECT *,xmin::text AS version FROM employee_schedules WHERE dgt_id=? AND work_date BETWEEN ? AND ? AND status<>'CANCELLED' AND (? OR status<>'DRAFT') ORDER BY schedule_start,schedule_id",store,week,weekEnd,manager);
  var empIds=shiftRows.stream().map(s->number(s.get("employee_id"))).collect(java.util.stream.Collectors.toSet());
  var availByEmp=new HashMap<Long,List<Map<String,Object>>>();
  if(!empIds.isEmpty()){String ph=empIds.stream().map(id->"?").collect(java.util.stream.Collectors.joining(","));var ap=new ArrayList<Object>();ap.add(store);ap.addAll(empIds);ap.add(weekEnd.plusDays(2));ap.add(week.minusDays(1));ap.add(weekEnd.plusDays(2));for(var r:a.db.queryForList("SELECT * FROM workforce_availability WHERE dgt_id=? AND employee_id IN ("+ph+") AND ((kind='EXCEPTION' AND start_date<=? AND end_date>=?) OR (kind='AVAILABILITY' AND start_date<=?)) ORDER BY employee_id",ap.toArray()))availByEmp.computeIfAbsent(number(r.get("employee_id")),k->new ArrayList<>()).add(r);}
  var shifts=new ArrayList<Map<String,Object>>();for(var s:shiftRows){var out=Rows.normalize(s);var start=instant(s.get("schedule_start")).atZone(tz);var end=instant(s.get("schedule_end")).atZone(tz);out.put("start_local",start.toLocalDateTime().toString());out.put("end_local",end.toLocalDateTime().toString());out.put("start_offset",start.getOffset().toString());out.put("end_offset",end.getOffset().toString());out.put("hours",Duration.between(start,end).toMinutes()/60.0);out.put("availability_warning",availabilityConflictInMemory(availByEmp.getOrDefault(number(s.get("employee_id")),List.of()),start.toLocalDateTime(),end.toLocalDateTime()));if(!manager){out.remove("notes");out.remove("override_reason");}shifts.add(out);}
  var requests=new ArrayList<Map<String,Object>>();for(var r:a.db.queryForList("SELECT *,xmin::text AS version FROM workforce_requests WHERE dgt_id=? ORDER BY request_id DESC LIMIT 1000",store)){long emp=number(r.get("employee_id"));boolean own=own(store,emp),target=r.get("target_employee_id")!=null&&own(store,number(r.get("target_employee_id")));boolean openCover="COVER".equals(r.get("kind"))&&r.get("target_employee_id")==null&&"PENDING".equals(r.get("status"));if(!manager&&!own&&!target&&number(r.get("submitted_by"))!=uid&&!openCover)continue;var out=Rows.normalize(r);out.put("payload",json.readTree(r.get("payload").toString()));out.put("can_review",reviewer(store,r));out.put("can_cancel",own||number(r.get("submitted_by"))==uid);out.put("can_decline",Set.of("COVER","SWAP").contains(r.get("kind"))&&r.get("target_employee_id")!=null&&(manager||target));out.put("can_accept",Set.of("COVER","SWAP").contains(r.get("kind"))&&(manager||target||openCover));if(!manager&&!own&&number(r.get("submitted_by"))!=uid){var sanitized=json.readTree(r.get("payload").toString());((tools.jackson.databind.node.ObjectNode)sanitized).remove("reason");out.put("payload",sanitized);}
   if("TIME_OFF".equals(r.get("kind"))){var p=payload(r);var saved=a.db.queryForList("SELECT work_date,start_at,end_at FROM workforce_leave_shifts WHERE request_id=?",r.get("request_id"));if(saved.isEmpty()&&!"APPROVED".equals(r.get("status")))saved=affected(store,p).stream().map(s->Map.of("work_date",s.get("work_date"),"start_at",s.get("schedule_start"),"end_at",s.get("schedule_end"))).toList();out.put("days",saved.isEmpty()?null:saved.stream().map(s->s.get("work_date")).distinct().count());out.put("hours",saved.isEmpty()?null:saved.stream().mapToDouble(s->Duration.between(instant(s.get("start_at")),instant(s.get("end_at"))).toMinutes()/60.0).sum());}
   requests.add(out);
  }
  var availability=a.db.queryForList("SELECT wa.* FROM workforce_availability wa JOIN employees e ON e.employee_id=wa.employee_id WHERE wa.dgt_id=? AND (? OR e.user_id=?) ORDER BY wa.availability_id DESC",store,manager,uid).stream().map(Rows::normalize).toList();
  return Map.of("manager",manager,"admin",a.admin(uid,a.company(store)),"timezone",tz.toString(),"today",LocalDate.now(tz),"week",week,"employees",employees,"shifts",shifts,"requests",requests,"availability",availability);
 }
}
