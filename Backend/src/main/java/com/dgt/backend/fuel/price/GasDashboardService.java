package com.dgt.backend.fuel.price;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.util.*;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

/** Read-only recorded tank state. Authorization is enforced by the price controller. */
@Slf4j
@Service
public class GasDashboardService {
 private final ScopedAccess a;
 public GasDashboardService(ScopedAccess a){this.a=a;}
 public Map<String,Object> tanks(String store){
  log.debug("Fetching gas dashboard tanks store={}", store);
  var context=a.db.queryForMap("SELECT timezone,(CURRENT_TIMESTAMP AT TIME ZONE timezone)::date AS today,CURRENT_TIMESTAMP AS \"asOf\" FROM stores WHERE dgt_id=?",store);
  var tanks=a.db.queryForList("""
   SELECT t.tank_id::text AS id,t.tank_number AS number,t.capacity_gallons AS capacity,
    t.low_level_percentage AS threshold,
    CASE WHEN gr.n=1 THEN gr.name ELSE 'Unassigned / overlapping grades' END AS "gradeName",
    r.reading_datetime AS "measuredAt",r.volume_gallons AS "measuredGallons",
    r.volume_gallons+m.qty AS "currentGallons",
    coalesce(s.low_tank_dashboard,false) AS "lowEnabled",
    coalesce(s.missing_reading_dashboard,false) AS "missingEnabled",
    r.reading_datetime IS NULL OR (r.reading_datetime AT TIME ZONE st.timezone)::date < (CURRENT_TIMESTAMP AT TIME ZONE st.timezone)::date AS "missingToday"
   FROM fuel_tanks t JOIN stores st ON st.dgt_id=t.dgt_id
   LEFT JOIN gas_settings s ON s.dgt_id=t.dgt_id
   LEFT JOIN LATERAL (SELECT count(*) n,min(g.grade_name) name FROM fuel_tank_grade_assignments x
    JOIN fuel_grades g USING(fuel_grade_id) WHERE x.tank_id=t.tank_id AND g.is_active
    AND x.effective_from<=(CURRENT_TIMESTAMP AT TIME ZONE st.timezone)::date
    AND (x.effective_to IS NULL OR x.effective_to>=(CURRENT_TIMESTAMP AT TIME ZONE st.timezone)::date)) gr ON true
   LEFT JOIN LATERAL (SELECT reading_datetime,volume_gallons FROM fuel_tank_readings WHERE tank_id=t.tank_id
    AND reading_datetime<=CURRENT_TIMESTAMP ORDER BY reading_datetime DESC,tank_reading_id DESC LIMIT 1) r ON true
   LEFT JOIN LATERAL (SELECT coalesce(sum(qty_changed),0) qty FROM inventory_movements
    WHERE dgt_id=t.dgt_id AND tank_id=t.tank_id AND created_at>r.reading_datetime AND created_at<=CURRENT_TIMESTAMP) m ON true
   WHERE t.dgt_id=? ORDER BY t.tank_number,t.tank_id
   """,store);
  var result=new LinkedHashMap<String,Object>(Rows.normalize(context));
  result.put("tanks",tanks.stream().map(Rows::normalize).toList());return result;
 }
}
