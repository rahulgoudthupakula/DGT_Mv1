package com.dgt.backend.departments.controller;
import java.util.*;
import com.dgt.backend.access.service.ApprovalService;
import com.dgt.backend.departments.dto.CreateStoreDepartmentRequest;
import com.dgt.backend.departments.dto.UpdateStoreDepartmentRequest;
import com.dgt.backend.departments.dto.StoreDepartmentResponse;
import com.dgt.backend.departments.service.DefaultDepartmentCatalog;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.departments.service.StoreDepartmentService;
import com.dgt.backend.stores.service.StoreService;
import lombok.extern.slf4j.Slf4j;

/**
 * Department Access page API: combines global defaults with store overrides and custom departments.
 * Writes are submitted through ApprovalService with retry keys and version checks.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/stores/{dgtId}/department-access")
public class StoreDepartmentAccessController {
 private final ApprovalService approvals;
 private final DefaultDepartmentCatalog catalog;
 private final JdbcTemplate db; private final StoreService stores; private final StoreDepartmentService departments;
 public StoreDepartmentAccessController(JdbcTemplate db,StoreService stores,StoreDepartmentService departments,DefaultDepartmentCatalog catalog,ApprovalService approvals){this.approvals=approvals;this.catalog=catalog;this.db=db;this.stores=stores;this.departments=departments;}
 // List catalog defaults and store-specific entries; overlay saved activation state and xmin version.
 @GetMapping
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',false)")
 public List<Map<String,Object>> list(@PathVariable String dgtId){
  stores.get(dgtId);
  var rows=db.queryForList("SELECT 'default-'||department_id AS id,department_name AS name,'DEFAULT' AS source_type,true AS active,'0' AS version FROM departments WHERE is_default=true UNION ALL SELECT 'store-'||store_department_id,store_department_name,source_type,is_active,xmin::text FROM store_departments WHERE dgt_id=? AND (source_type <> 'DEFAULT' OR department_id IS NULL) ORDER BY name",dgtId);
  var result=new ArrayList<Map<String,Object>>();
  for(var row:rows){
   String name=(String)row.get("name");boolean defaults="DEFAULT".equals(row.get("source_type"));
   if(defaults&&!catalog.contains(name))continue;
   // Default entries without a store assignment retain their initial active state and version 0.
   if(defaults){
    var overrides=db.queryForList("SELECT is_active,xmin::text AS version FROM store_departments WHERE dgt_id=? AND department_id=? AND source_type='DEFAULT'",dgtId,Long.parseLong(((String)row.get("id")).substring(8)));
    if(overrides.size()>1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Duplicate default department assignments require review");
    if(!overrides.isEmpty()){row.put("active",overrides.getFirst().get("is_active"));row.put("version",overrides.getFirst().get("version"));}
   }
   row.put("subDepartments",defaults?catalog.children(name):List.of());result.add(row);
  }
  return result;
 }
 // Name supplied when creating a custom department for the selected store.
 public record Create(String name){}
 // Submit creation for the approval policy to process; the key identifies retried requests.
 @PostMapping
 @ResponseStatus(HttpStatus.CREATED)
 @Transactional
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',true)")
 public Object create(@PathVariable String dgtId,@RequestBody Create input,@RequestHeader("Idempotency-Key") String key){return approvals.submit(dgtId,"DEPARTMENT_CREATE",null,null,input,key);}
 // Apply the approved action under the caller transaction; lock the store and reject duplicate names.
 public Object applyCreate(String dgtId,Create input){
  stores.get(dgtId);db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",dgtId);
  String name=input.name()==null?"":input.name().trim();
  if(name.isBlank()||name.length()>150)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Department name must contain 1–150 characters");
  Integer count=db.queryForObject("SELECT (SELECT count(*) FROM departments WHERE is_default=true AND lower(trim(department_name))=lower(?))+(SELECT count(*) FROM store_departments WHERE dgt_id=? AND lower(trim(store_department_name))=lower(?))",Integer.class,name,dgtId,name);
  if(count!=null&&count>0)throw new ResponseStatusException(HttpStatus.CONFLICT,"A department with this name already exists for this store");
  return departments.create(new CreateStoreDepartmentRequest(dgtId, null, name, true, "CUSTOM"));
 }

 // Requested activation state; null is rejected when the action is applied.
 public record Toggle(Boolean active){}
 // Submit an activation change with the version the user reviewed and an idempotency key.
 @PatchMapping("/{id}")
 @Transactional
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',true)")
 public Object toggle(@PathVariable String dgtId,@PathVariable String id,@RequestHeader("If-Match") String version,@RequestBody Toggle input,@RequestHeader("Idempotency-Key") String key){return approvals.submit(dgtId,"DEPARTMENT_TOGGLE",id,version,input,key);}
 // Resolve the department within this store and reject stale versions before changing activation.
 public Map<String,Object> applyToggle(String dgtId,String id,String version,Toggle input){
  if(input.active()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"active is required");
  stores.get(dgtId);db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",dgtId);
  var current=list(dgtId).stream().filter(r->id.equals(r.get("id"))).findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Department not found for this store"));
  if(!Objects.equals(version,current.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Department changed; reload and retry");
  // A default toggle creates or updates a store override without changing the global definition.
  if(id.startsWith("default-")){
   Long definition=Long.parseLong(id.substring(8));
   if("0".equals(version)){
    departments.create(new CreateStoreDepartmentRequest(dgtId, definition, (String)current.get("name"), input.active(), "DEFAULT"));
   } else {
    int updated=db.update("UPDATE store_departments SET is_active=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND department_id=? AND source_type='DEFAULT' AND xmin::text=?",input.active(),dgtId,definition,version);
    if(updated!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Department changed; reload and retry");
   }
  }else{
   StoreDepartmentResponse existing=departments.get(Long.parseLong(id.substring(6)));
   departments.update(existing.storeDepartmentId(), new UpdateStoreDepartmentRequest(existing.dgtId(), existing.departmentId(), existing.storeDepartmentName(), input.active(), existing.sourceType()));
  }
  return list(dgtId).stream().filter(r->id.equals(r.get("id"))).findFirst().orElseThrow();
 }
}
