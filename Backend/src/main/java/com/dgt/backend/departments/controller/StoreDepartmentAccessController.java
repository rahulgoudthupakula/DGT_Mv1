package com.dgt.backend.departments.controller;
import java.util.*;
import com.dgt.backend.access.ApprovalService;
import com.dgt.backend.departments.service.DefaultDepartmentCatalog;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.departments.service.StoreDepartmentService;
import com.dgt.backend.stores.service.StoreService;
@RestController
@RequestMapping("/api/v1/stores/{dgtId}/department-access")
public class StoreDepartmentAccessController {
 private final ApprovalService approvals;
 private final DefaultDepartmentCatalog catalog;
 private final JdbcTemplate db; private final StoreService stores; private final StoreDepartmentService departments;
 public StoreDepartmentAccessController(JdbcTemplate db,StoreService stores,StoreDepartmentService departments,DefaultDepartmentCatalog catalog,ApprovalService approvals){this.approvals=approvals;this.catalog=catalog;this.db=db;this.stores=stores;this.departments=departments;}
 @GetMapping
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',false)")
 public List<Map<String,Object>> list(@PathVariable String dgtId){
  stores.get(dgtId);
  var rows=db.queryForList("SELECT 'default-'||department_id AS id,department_name AS name,'DEFAULT' AS source_type,true AS active,'0' AS version FROM departments WHERE is_default=true UNION ALL SELECT 'store-'||store_department_id,store_department_name,source_type,is_active,xmin::text FROM store_departments WHERE dgt_id=? AND (source_type <> 'DEFAULT' OR department_id IS NULL) ORDER BY name",dgtId);
  var result=new ArrayList<Map<String,Object>>();
  for(var row:rows){
   String name=(String)row.get("name");boolean defaults="DEFAULT".equals(row.get("source_type"));
   // Keep unrelated test fixtures out of the original default catalog display.
   if(defaults&&!catalog.contains(name))continue;
   if(defaults){
    var overrides=db.queryForList("SELECT is_active,xmin::text AS version FROM store_departments WHERE dgt_id=? AND department_id=? AND source_type='DEFAULT'",dgtId,Long.parseLong(((String)row.get("id")).substring(8)));
    if(overrides.size()>1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Duplicate default department assignments require review");
    if(!overrides.isEmpty()){row.put("active",overrides.getFirst().get("is_active"));row.put("version",overrides.getFirst().get("version"));}
   }
   row.put("subDepartments",defaults?catalog.children(name):List.of());result.add(row);
  }
  return result;
 }
 public record Create(String name){}
 @PostMapping
 @ResponseStatus(HttpStatus.CREATED)
 @Transactional
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',true)")
 public Object create(@PathVariable String dgtId,@RequestBody Create input,@RequestHeader("Idempotency-Key") String key){return approvals.submit(dgtId,"DEPARTMENT_CREATE",null,null,input,key);}
 public Map<String,Object> applyCreate(String dgtId,Create input){
  stores.get(dgtId);db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",dgtId);
  String name=input.name()==null?"":input.name().trim();
  if(name.isBlank()||name.length()>150)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Department name must contain 1–150 characters");
  Integer count=db.queryForObject("SELECT (SELECT count(*) FROM departments WHERE is_default=true AND lower(trim(department_name))=lower(?))+(SELECT count(*) FROM store_departments WHERE dgt_id=? AND lower(trim(store_department_name))=lower(?))",Integer.class,name,dgtId,name);
  if(count!=null&&count>0)throw new ResponseStatusException(HttpStatus.CONFLICT,"A department with this name already exists for this store");
  return departments.create(Map.of("dgt_id",dgtId,"store_department_name",name,"source_type","CUSTOM","is_active",true));
 }

 public record Toggle(Boolean active){}
 @PatchMapping("/{id}")
 @Transactional
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',true)")
 public Object toggle(@PathVariable String dgtId,@PathVariable String id,@RequestHeader("If-Match") String version,@RequestBody Toggle input,@RequestHeader("Idempotency-Key") String key){return approvals.submit(dgtId,"DEPARTMENT_TOGGLE",id,version,input,key);}
 public Map<String,Object> applyToggle(String dgtId,String id,String version,Toggle input){
  if(input.active()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"active is required");
  stores.get(dgtId);db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",dgtId);
  var current=list(dgtId).stream().filter(r->id.equals(r.get("id"))).findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Department not found for this store"));
  if(!Objects.equals(version,current.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Department changed; reload and retry");
  if(id.startsWith("default-")){
   Long definition=Long.parseLong(id.substring(8));
   if("0".equals(version))departments.create(Map.of("dgt_id",dgtId,"department_id",definition,"store_department_name",current.get("name"),"source_type","DEFAULT","is_active",input.active()));
   else {
    int updated=db.update("UPDATE store_departments SET is_active=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND department_id=? AND source_type='DEFAULT' AND xmin::text=?",input.active(),dgtId,definition,version);
    if(updated!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Department changed; reload and retry");
   }
  }else departments.update(Long.parseLong(id.substring(6)),Map.of("is_active",input.active()),version);
  return list(dgtId).stream().filter(r->id.equals(r.get("id"))).findFirst().orElseThrow();
 }
}
