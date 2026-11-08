package com.dgt.backend.access.service;
import com.dgt.backend.access.repository.EmployeePermissionRepository;
import com.dgt.backend.access.security.PagePermissions;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.dto.EmployeePermissionRequest;

import java.util.*;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

/**
 * Manages one employee website account's store-specific page overrides. The employee must belong
 * to the selected store and have an active supported role; company administrators retain full
 * access.
 */

@org.springframework.stereotype.Service

public class EmployeePermissionService {
 private final EmployeePermissionRepository repository;
 private final ScopedAccess a;private final PagePermissions pages;private final ObjectMapper json;
 public EmployeePermissionService(ScopedAccess a,PagePermissions pages,ObjectMapper json, EmployeePermissionRepository repository){this.repository=repository;this.a=a;this.pages=pages;this.json=json;}
 // Translate employee ID into its active website user ID and verify store ownership before reading
 // or writing overrides.
 private long target(String store,long employee){
  a.requireAdmin(store);
  var ids=repository.findEmployeeUsers(employee, store);
  if(ids.size()!=1)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Employee needs an active website account in this store");
  long user=ids.getFirst();if(a.admin(user,a.company(store)))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Admin has full access");return user;
 }
 // Version 0 represents no saved override row; xmin identifies the existing row snapshot.
 private Map<String,Object> snapshot(String store,long user){
  var rows=repository.findSnapshot(store, user);
  return rows.isEmpty()?Map.of("overrides",json.readTree("{}"),"version","0"):Map.of("overrides",json.readTree((String)rows.getFirst().get("overrides")),"version",rows.getFirst().get("version"));
 }
 // Return both inherited defaults and effective overrides so the editor can explain each choice.
  public Object get(String store,long id){
  long user=target(store,id);var result=new LinkedHashMap<String,Object>(snapshot(store,user));
  result.put("sections",PagePermissions.SECTIONS);result.put("pages",PagePermissions.PAGES);result.put("children",PagePermissions.CHILDREN);
  result.put("roleDefaults",pages.evaluate(store,user,false,false));result.put("effective",pages.evaluate(store,user,false,true));return result;
 }

 // Replace the override map after code validation and a version check; omitted codes inherit role
 // defaults.
  @Transactional public Object save(String store,long id,EmployeePermissionRequest in){
  a.requireAdmin(store);repository.lockCompany(a.company(store));long user=target(store,id);
  if(in.overrides()==null||in.overrides().size()>500)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid overrides");
  Set<String> codes=new HashSet<>();PagePermissions.SECTIONS.forEach(p->codes.add(p.code()));PagePermissions.PAGES.forEach(p->codes.add(p.code()));PagePermissions.CHILDREN.forEach(p->codes.add(p.code()));
  for(var entry:in.overrides().entrySet())if(!codes.contains(entry.getKey())||entry.getValue()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown permission or invalid choice");
  if(!Objects.equals(in.version(),snapshot(store,user).get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Employee permissions changed. Close and reopen to reload before saving");
  repository.saveOverrides(store, user, json.writeValueAsString(in.overrides()), a.user());
  a.audit(store,"EMPLOYEE_PERMISSIONS_UPDATED",Long.toString(id),json.writeValueAsString(in.overrides()));return get(store,id);
 }
}
