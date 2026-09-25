package com.dgt.backend.access;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/v1/access/stores/{store}/employee-access/{id}/permissions")
public class EmployeePermissionController {
 private final ScopedAccess a;private final PagePermissions pages;private final ObjectMapper json;
 public EmployeePermissionController(ScopedAccess a,PagePermissions pages,ObjectMapper json){this.a=a;this.pages=pages;this.json=json;}
 private long target(String store,long employee){
  a.requireAdmin(store);
  var ids=a.db.queryForList("SELECT DISTINCT e.user_id FROM employees e JOIN employee_store_assignments s USING(employee_id) JOIN users u USING(user_id) WHERE e.employee_id=? AND s.dgt_id=? AND u.account_status='ACTIVE' AND EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.user_id=e.user_id AND r.dgt_id=s.dgt_id AND r.is_active AND t.is_active AND upper(t.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT'))",Long.class,employee,store);
  if(ids.size()!=1)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Employee needs an active website account in this store");
  long user=ids.getFirst();if(a.admin(user,a.company(store)))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Admin has full access");return user;
 }
 private Map<String,Object> snapshot(String store,long user){
  var rows=a.db.queryForList("SELECT overrides::text,xmin::text AS version FROM user_store_permission_overrides WHERE dgt_id=? AND user_id=?",store,user);
  return rows.isEmpty()?Map.of("overrides",json.readTree("{}"),"version","0"):Map.of("overrides",json.readTree((String)rows.getFirst().get("overrides")),"version",rows.getFirst().get("version"));
 }
 @GetMapping public Object get(@PathVariable String store,@PathVariable long id){
  long user=target(store,id);var result=new LinkedHashMap<String,Object>(snapshot(store,user));
  result.put("sections",PagePermissions.SECTIONS);result.put("pages",PagePermissions.PAGES);result.put("children",PagePermissions.CHILDREN);
  result.put("roleDefaults",pages.evaluate(store,user,false,false));result.put("effective",pages.evaluate(store,user,false,true));return result;
 }
 public record Input(Map<String,Boolean> overrides,String version){}
 @PutMapping @Transactional public Object save(@PathVariable String store,@PathVariable long id,@RequestBody Input in){
  a.requireAdmin(store);a.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",a.company(store));long user=target(store,id);
  if(in.overrides()==null||in.overrides().size()>500)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid overrides");
  Set<String> codes=new HashSet<>();PagePermissions.SECTIONS.forEach(p->codes.add(p.code()));PagePermissions.PAGES.forEach(p->codes.add(p.code()));PagePermissions.CHILDREN.forEach(p->codes.add(p.code()));
  for(var entry:in.overrides().entrySet())if(!codes.contains(entry.getKey())||entry.getValue()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown permission or invalid choice");
  if(!Objects.equals(in.version(),snapshot(store,user).get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Employee permissions changed. Close and reopen to reload before saving");
  a.db.update("INSERT INTO user_store_permission_overrides(dgt_id,user_id,overrides,updated_by) VALUES (?,?,?::jsonb,?) ON CONFLICT(dgt_id,user_id) DO UPDATE SET overrides=EXCLUDED.overrides,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP",store,user,json.writeValueAsString(in.overrides()),a.user());
  a.audit(store,"EMPLOYEE_PERMISSIONS_UPDATED",Long.toString(id),json.writeValueAsString(in.overrides()));return get(store,id);
 }
}
