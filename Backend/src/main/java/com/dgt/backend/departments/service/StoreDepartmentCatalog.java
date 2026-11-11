package com.dgt.backend.departments.service;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** Read-only selector catalog; two store-scoped queries regardless of department count. */
@Service
public class StoreDepartmentCatalog {
 private final JdbcTemplate db;
 public StoreDepartmentCatalog(JdbcTemplate db){this.db=db;}
 public List<Map<String,Object>> options(String store){
  var parents=db.queryForList("SELECT store_department_id,store_department_name FROM store_departments WHERE dgt_id=? AND is_active ORDER BY (department_id IS NULL),store_department_name",store);
  var children=db.queryForList("SELECT s.store_department_id,s.store_sub_department_name FROM store_sub_departments s JOIN store_departments d ON d.store_department_id=s.store_department_id AND d.dgt_id=s.dgt_id WHERE s.dgt_id=? AND d.is_active AND s.is_active ORDER BY s.store_sub_department_name",store);
  var byParent=new HashMap<Object,List<String>>();
  for(var child:children)byParent.computeIfAbsent(child.get("store_department_id"),id->new ArrayList<>()).add((String)child.get("store_sub_department_name"));
  return parents.stream().<Map<String,Object>>map(parent->Map.of("name",parent.get("store_department_name"),"children",byParent.getOrDefault(parent.get("store_department_id"),List.of()))).toList();
 }
}
