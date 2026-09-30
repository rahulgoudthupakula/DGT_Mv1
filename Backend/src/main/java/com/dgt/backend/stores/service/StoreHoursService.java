package com.dgt.backend.stores.service;
import java.util.*;
import java.time.*;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.common.entity.Rows;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@Service
public class StoreHoursService {
 private final JdbcTemplate db;
 public StoreHoursService(JdbcTemplate db) { this.db=db; }
 public List<Map<String,Object>> get(String id) {
  log.debug("Fetching store hours id={}", id);
  return db.queryForList("SELECT day_of_week,status,open_time,close_time,xmin::text AS _version FROM store_business_hours WHERE dgt_id=? ORDER BY day_of_week",id).stream().map(Rows::normalize).toList();
 }
 public record Day(String day_of_week,String status,LocalTime open_time,LocalTime close_time) {}
 public void save(String id,List<Day> days,Map<String,String> versions) {
  log.info("Saving store hours id={}", id);
  var current=new HashMap<String,String>();
  for(var row:db.queryForList("SELECT day_of_week,xmin::text AS version FROM store_business_hours WHERE dgt_id=? FOR UPDATE",id)) current.put((String)row.get("day_of_week"),(String)row.get("version"));
  if(!Objects.equals(current,versions)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Business hours changed; reload before editing");
  var seen=new HashSet<String>();
  if(days.size()!=7) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Provide all seven weekdays");
  for(var d:days) {
   try { DayOfWeek.valueOf(d.day_of_week()); } catch(Exception e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid weekday"); }
   if(!seen.add(d.day_of_week()) || d.status()==null || !Set.of("SCHEDULED","CLOSED","OPEN_24_HOURS","UNSET").contains(d.status())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid or repeated day/status");
   boolean scheduled=d.status().equals("SCHEDULED");
   if(scheduled ? d.open_time()==null || d.close_time()==null || d.open_time().equals(d.close_time()) : d.open_time()!=null || d.close_time()!=null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Scheduled days need different opening and closing times; other statuses must have no times");
   if(!current.containsKey(d.day_of_week()) && d.status().equals("UNSET")) continue;
   db.update("INSERT INTO store_business_hours(dgt_id,day_of_week,status,open_time,close_time) VALUES (?,?,?,?,?) ON CONFLICT(dgt_id,day_of_week) DO UPDATE SET status=EXCLUDED.status,open_time=EXCLUDED.open_time,close_time=EXCLUDED.close_time,updated_at=CURRENT_TIMESTAMP",id,d.day_of_week(),d.status(),d.open_time(),d.close_time());
  }
 }
}
