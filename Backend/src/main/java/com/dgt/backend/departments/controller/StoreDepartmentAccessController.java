package com.dgt.backend.departments.controller;

import java.util.*;
import com.dgt.backend.access.service.ApprovalService;
import com.dgt.backend.stores.service.StoreService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Store-owned department hierarchy. All mutations retain approval and optimistic-lock checks. */
@RestController
@RequestMapping("/api/v1/stores/{dgtId}/department-access")
public class StoreDepartmentAccessController {
 private final ApprovalService approvals;
 private final JdbcTemplate db;
 private final StoreService stores;
 public StoreDepartmentAccessController(JdbcTemplate db,StoreService stores,ApprovalService approvals){
  this.approvals=approvals;this.db=db;this.stores=stores;
 }

 @GetMapping
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',false)")
 public List<Map<String,Object>> list(@PathVariable String dgtId){
  stores.get(dgtId);
  // Keep the established default-/store- IDs so pending approvals remain addressable.
  var rows=db.queryForList("SELECT CASE WHEN department_id IS NOT NULL THEN 'default-'||department_id ELSE 'store-'||store_department_id END AS id,store_department_id,store_department_name AS name,source_type,is_active AS active,xmin::text AS version FROM store_departments WHERE dgt_id=? ORDER BY store_department_name",dgtId);
  var children=db.queryForList("SELECT store_department_id,store_sub_department_id::text AS id,store_sub_department_name AS name,is_active AS active FROM store_sub_departments WHERE dgt_id=? ORDER BY store_sub_department_name",dgtId);
  for(var row:rows){
   var subs=children.stream().filter(c->Objects.equals(c.get("store_department_id"),row.get("store_department_id"))).map(c->Map.of("id",c.get("id"),"name",c.get("name"),"active",c.get("active"))).toList();
   // Retain the names array for older clients while exposing editable child records separately.
   row.put("subDepartments",subs.stream().map(c->c.get("name")).toList());
   row.put("subDepartmentDetails",subs);
   row.remove("store_department_id");
  }
  return rows;
 }
 public record Child(String id,String name,Boolean active){}
 public record Create(String name,List<Child> subDepartments){}
 public record Edit(String name,List<Child> subDepartments){}
 public record Toggle(Boolean active){}

 @PostMapping
 @ResponseStatus(HttpStatus.CREATED)
 @Transactional
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',true)")
 public Object create(@PathVariable String dgtId,@RequestBody Create input,@RequestHeader("Idempotency-Key") String key){return approvals.submit(dgtId,"DEPARTMENT_CREATE",null,null,input,key);}

 @PutMapping("/{id}")
 @Transactional
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',true)")
 public Object edit(@PathVariable String dgtId,@PathVariable String id,@RequestHeader("If-Match") String version,@RequestBody Edit input,@RequestHeader("Idempotency-Key") String key){return approvals.submit(dgtId,"DEPARTMENT_EDIT",id,version,input,key);}

 @PatchMapping("/{id}")
 @Transactional
 @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'DEPARTMENTS',true)")
 public Object toggle(@PathVariable String dgtId,@PathVariable String id,@RequestHeader("If-Match") String version,@RequestBody Toggle input,@RequestHeader("Idempotency-Key") String key){return approvals.submit(dgtId,"DEPARTMENT_TOGGLE",id,version,input,key);}

 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private String name(String value){
  String result=value==null?"":value.trim();
  if(result.isEmpty()||result.length()>150)throw bad("Department and subdepartment names must contain 1–150 characters");
  return result;
 }
 private void lockStore(String store){stores.get(store);db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);}
 private Map<String,Object> current(String store,String id,String version){
  var row=list(store).stream().filter(r->id.equals(r.get("id"))).findFirst().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Department not found for this store"));
  if(!Objects.equals(version,row.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Department changed; reload and retry");
  return row;
 }
 private long departmentId(String store,String id){
  try{
   if(id.startsWith("default-"))return db.queryForObject("SELECT store_department_id FROM store_departments WHERE dgt_id=? AND department_id=?",Long.class,store,Long.parseLong(id.substring(8)));
   if(id.startsWith("store-"))return db.queryForObject("SELECT store_department_id FROM store_departments WHERE dgt_id=? AND store_department_id=?",Long.class,store,Long.parseLong(id.substring(6)));
  }catch(NumberFormatException e){throw bad("Invalid department ID");}
  throw bad("Invalid department ID");
 }
 private void uniqueName(String store,String name,Long except){
  if(Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM store_departments WHERE dgt_id=? AND lower(trim(store_department_name))=lower(?) AND (?::bigint IS NULL OR store_department_id<>?))",Boolean.class,store,name,except,except)))
   throw new ResponseStatusException(HttpStatus.CONFLICT,"A department with this name already exists for this store");
 }
 public Object applyCreate(String store,Create input){
  lockStore(store);String name=name(input.name());uniqueName(store,name,null);
  long id=db.queryForObject("INSERT INTO store_departments(dgt_id,store_department_name,source_type) VALUES (?,?,'CUSTOM') RETURNING store_department_id",Long.class,store,name);
  saveChildren(store,id,input.subDepartments());
  return list(store).stream().filter(r->("store-"+id).equals(r.get("id"))).findFirst().orElseThrow();
 }
 public Object applyEdit(String store,String id,String version,Edit input){
  lockStore(store);current(store,id,version);long parent=departmentId(store,id);
  String name=name(input.name());uniqueName(store,name,parent);
  saveChildren(store,parent,input.subDepartments());
  // Touch the parent even for a child-only change: one version protects the entire edit form.
  db.update("UPDATE store_departments SET store_department_name=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND store_department_id=?",name,store,parent);
  return list(store).stream().filter(r->id.equals(r.get("id"))).findFirst().orElseThrow();
 }
 public Map<String,Object> applyToggle(String store,String id,String version,Toggle input){
  if(input.active()==null)throw bad("active is required");
  lockStore(store);current(store,id,version);long parent=departmentId(store,id);
  db.update("UPDATE store_departments SET is_active=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND store_department_id=?",input.active(),store,parent);
  return list(store).stream().filter(r->id.equals(r.get("id"))).findFirst().orElseThrow();
 }
 /** Omitted children are retained. Existing IDs never change, preserving product assignments. */
 private void saveChildren(String store,long parent,List<Child> children){
  if(children==null)return;
  if(children.size()>500)throw bad("A department can submit at most 500 subdepartments at once");
  var existing=db.queryForList("SELECT store_sub_department_id::text AS id,store_sub_department_name AS name FROM store_sub_departments WHERE dgt_id=? AND store_department_id=?",store,parent);
  var names=new HashMap<String,String>();for(var row:existing)names.put((String)row.get("id"),((String)row.get("name")).trim().toLowerCase(Locale.ROOT));
  var ids=new HashSet<String>();var submittedNames=new HashSet<String>();
  for(var child:children){
   if(child==null)throw bad("Subdepartment is required");
   String value=name(child.name()).toLowerCase(Locale.ROOT);
   if(child.active()==null)throw bad("Subdepartment active status is required");
   if(!submittedNames.add(value))throw bad("Subdepartment names must be unique within the department");
   if(child.id()!=null&&(!names.containsKey(child.id())||!ids.add(child.id())))throw bad("Subdepartment does not belong to this department or was included twice");
   if(names.entrySet().stream().anyMatch(e->!e.getKey().equals(child.id())&&e.getValue().equals(value)))throw bad("A subdepartment with this name already exists");
  }
  for(var child:children){
   if(child.id()==null)db.update("INSERT INTO store_sub_departments(dgt_id,store_department_id,store_sub_department_name,is_active,source_type) VALUES (?,?,?,?,'CUSTOM')",store,parent,name(child.name()),child.active());
   else db.update("UPDATE store_sub_departments SET store_sub_department_name=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND store_department_id=? AND store_sub_department_id=?",name(child.name()),child.active(),store,parent,Long.parseLong(child.id()));
  }
 }
}
