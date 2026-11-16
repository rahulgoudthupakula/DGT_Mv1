package com.dgt.backend.attendance;

import com.dgt.backend.pos.security.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.*;
import java.sql.Timestamp;
import java.util.*;

/** Normalized work intervals supplied by the connector, never inferred from sales. */
@Service
public class AttendanceIngestion {
 @tools.jackson.databind.annotation.JsonNaming(tools.jackson.databind.PropertyNamingStrategies.LowerCamelCaseStrategy.class)
 public record Entry(Integer version,String dgtId,String sourceSystem,String sourceEntryId,String cashierCode,OffsetDateTime clockIn,OffsetDateTime clockOut){}
 private final JdbcTemplate db;
 public AttendanceIngestion(JdbcTemplate db){this.db=db;}
 private ResponseStatusException invalid(String message){return new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,message);}
 private void text(String value,int max){if(value==null||value.isBlank()||value.length()>max)throw invalid("Missing or invalid source identity");}
 @Transactional public Object ingest(PosIdentity c,Entry e){
  if(e==null||!Integer.valueOf(1).equals(e.version()))throw invalid("Unsupported attendance contract version");
  text(e.sourceSystem(),100);text(e.sourceEntryId(),150);text(e.cashierCode(),100);
  if(!c.store().equals(e.dgtId()))throw new ResponseStatusException(HttpStatus.FORBIDDEN);
  Instant start=e.clockIn()==null?null:e.clockIn().toInstant(),end=e.clockOut()==null?null:e.clockOut().toInstant();
  if(start==null||start.isAfter(Instant.now())||end!=null&&(!end.isAfter(start)||end.isAfter(Instant.now())))throw invalid("Clock-out must follow clock-in; future punches are not accepted");
  var connector=db.queryForList("SELECT source_system FROM pos_connectors WHERE connector_id=? AND dgt_id=? AND active FOR UPDATE",c.id(),c.store());
  if(connector.isEmpty())throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
  if(!e.sourceSystem().equals(connector.getFirst().get("source_system")))throw invalid("Source system does not match this connector");
  if(!Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM stores s JOIN companies c USING(company_id) WHERE s.dgt_id=? AND c.is_active)",Boolean.class,c.store())))throw new ResponseStatusException(HttpStatus.FORBIDDEN);
  ZoneId zone=ZoneId.of(db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,c.store()));
  var ids=db.queryForList("SELECT target_id FROM pos_mappings WHERE connector_id=? AND kind='CASHIER' AND source_code=?",Long.class,c.id(),e.cashierCode());
  if(ids.size()!=1)throw invalid("Map the timeclock employee code to an employee before retrying");
  long employee=ids.getFirst();
  // Lock the employee across stores and connectors, so simultaneous intervals cannot overlap.
  db.queryForList("SELECT employee_id FROM employees WHERE employee_id=? FOR UPDATE",employee);
  var old=db.queryForList("SELECT * FROM employee_time_entries WHERE dgt_id=? AND source_system=? AND source_entry_id=? FOR UPDATE",c.store(),e.sourceSystem(),e.sourceEntryId());
  Long id=old.isEmpty()?null:((Number)old.getFirst().get("time_entry_id")).longValue();
  if(id!=null){var row=old.getFirst();Instant previousEnd=row.get("clock_out")==null?null:((Timestamp)row.get("clock_out")).toInstant();
   if(((Number)row.get("employee_id")).longValue()!=employee||!start.equals(((Timestamp)row.get("clock_in")).toInstant())||!e.cashierCode().equals(row.get("source_employee_code"))||!c.id().equals(row.get("connector_id")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Source entry identity already belongs to different punch data");
   if(Objects.equals(end,previousEnd))return Map.of("outcome","DUPLICATE","timeEntryId",id);
   if(previousEnd!=null||end==null)throw new ResponseStatusException(HttpStatus.CONFLICT,"A completed punch cannot be replaced by a retry");
  }
  LocalDate first=start.atZone(zone).toLocalDate(),last=end==null?first:end.minusNanos(1).atZone(zone).toLocalDate();
  // Retain historical periods after rehire; the latest hire date alone is insufficient.
  if(!Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM employee_employment_periods WHERE employee_id=? AND dgt_id=? AND hired_on<=? AND (ended_on IS NULL OR ended_on>=?) UNION ALL SELECT 1 FROM employee_store_assignments a JOIN employees e USING(employee_id) WHERE a.employee_id=? AND a.dgt_id=? AND a.effective_from<=? AND (a.effective_to IS NULL OR a.effective_to>=?) AND e.hire_date<=? AND (e.termination_date IS NULL OR e.termination_date>=?) AND NOT EXISTS(SELECT 1 FROM employee_employment_periods p WHERE p.employee_id=a.employee_id AND p.dgt_id=a.dgt_id))",Boolean.class,employee,c.store(),first,last,employee,c.store(),first,last,first,last)))throw invalid("Employee was not assigned to this store for these punch dates");
  if(Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM employee_time_entries WHERE employee_id=? AND (?::bigint IS NULL OR time_entry_id<>?) AND clock_in<coalesce(?::timestamptz,'infinity') AND (clock_out IS NULL OR clock_out>?))",Boolean.class,employee,id,id,end==null?null:Timestamp.from(end),Timestamp.from(start))))throw new ResponseStatusException(HttpStatus.CONFLICT,"This employee already has an overlapping punch; review it before retrying");
  if(id==null)id=db.queryForObject("INSERT INTO employee_time_entries(employee_id,dgt_id,clock_in,clock_out,event_type,source_system,source_entry_id,source_employee_code,connector_id) VALUES (?,?,?,?,'POS_TIMECLOCK',?,?,?,?) RETURNING time_entry_id",Long.class,employee,c.store(),Timestamp.from(start),end==null?null:Timestamp.from(end),e.sourceSystem(),e.sourceEntryId(),e.cashierCode(),c.id());
  else db.update("UPDATE employee_time_entries SET clock_out=?,updated_at=now() WHERE time_entry_id=?",Timestamp.from(end),id);
  return Map.of("outcome","ACCEPTED","timeEntryId",id);
 }
}
