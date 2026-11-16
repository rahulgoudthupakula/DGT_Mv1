package com.dgt.backend.employees.controller;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.service.AccessService;
import com.dgt.backend.common.entity.Rows;

import com.dgt.backend.access.dto.CreateAccessUserRequest;
import com.dgt.backend.access.dto.RoleAssignmentRequest;
import java.util.*;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * Admin workflow linking employee records to website accounts and store roles.
 * Enabled by app.workweek.enabled; changing employment details is a separate workflow.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/access/stores/{store}/employee-access")
@ConditionalOnProperty(name="app.workweek.enabled",havingValue="true")
public class EmployeeWebsiteAccessController {
 private final ScopedAccess a;private final AccessService accounts;
 public EmployeeWebsiteAccessController(ScopedAccess a,AccessService accounts){this.a=a;this.accounts=accounts;}
 // Return store employee account links, role state, and a combined employee/role version.
 @GetMapping public Object list(@PathVariable String store){a.requireAdmin(store);return a.db.queryForList("SELECT (CURRENT_TIMESTAMP AT TIME ZONE s.timezone)::date AS today,(SELECT CASE WHEN bool_or(public.role_access_active(ur.is_active,ur.access_ends_on,ur.dgt_id)) THEN max(ur.access_ends_on) FILTER (WHERE public.role_access_active(ur.is_active,ur.access_ends_on,ur.dgt_id)) ELSE max(ur.access_ends_on) FILTER (WHERE ur.is_active) END FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=esa.dgt_id) AS access_ends_on,e.employee_id,e.user_id,coalesce(esa.job_title,'') AS job_role,coalesce(u.first_name,e.first_name) AS first_name,coalesce(u.last_name,e.last_name) AS last_name,u.email,EXISTS(SELECT 1 FROM company_admins ca WHERE ca.user_id=e.user_id AND ca.company_id=s.company_id AND ca.is_active) AS admin,e.xmin::text || ':' || coalesce((SELECT string_agg(ur.user_role_id::text || '-' || ur.xmin::text,',' ORDER BY ur.user_role_id) FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=?),'0') AS version,coalesce(esa.role_type_id,(SELECT ur.role_type_id FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=? ORDER BY public.role_access_active(ur.is_active,ur.access_ends_on,ur.dgt_id) DESC,ur.user_role_id LIMIT 1)) AS role_type_id,EXISTS(SELECT 1 FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=? AND public.role_access_active(ur.is_active,ur.access_ends_on,ur.dgt_id)) AS active FROM employees e JOIN employee_store_assignments esa ON esa.employee_id=e.employee_id JOIN stores s ON s.dgt_id=esa.dgt_id LEFT JOIN users u ON u.user_id=e.user_id WHERE esa.dgt_id=? ORDER BY coalesce(u.first_name,e.first_name),e.employee_id",store,store,store,store).stream().map(Rows::normalize).toList();}
 public record EndAccessInput(String version,LocalDate endDate){}
 public record AccessVersion(String version){}
 private Map<String,Object> accessState(String store,long id){
  var rows=a.db.queryForList("SELECT (SELECT CASE WHEN bool_or(public.role_access_active(ur.is_active,ur.access_ends_on,ur.dgt_id)) THEN max(ur.access_ends_on) FILTER (WHERE public.role_access_active(ur.is_active,ur.access_ends_on,ur.dgt_id)) ELSE max(ur.access_ends_on) FILTER (WHERE ur.is_active) END FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=esa.dgt_id) AS access_ends_on,EXISTS(SELECT 1 FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=esa.dgt_id AND public.role_access_active(ur.is_active,ur.access_ends_on,ur.dgt_id)) AS active,esa.role_type_id,e.user_id,e.xmin::text || ':' || coalesce((SELECT string_agg(ur.user_role_id::text || '-' || ur.xmin::text,',' ORDER BY ur.user_role_id) FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=?),'0') AS version FROM employees e JOIN employee_store_assignments esa ON esa.employee_id=e.employee_id WHERE e.employee_id=? AND esa.dgt_id=?",store,id,store);
  if(rows.size()!=1)throw a.denied();return rows.getFirst();
 }
 private LocalDate today(String store){return a.db.queryForObject("SELECT (CURRENT_TIMESTAMP AT TIME ZONE timezone)::date FROM stores WHERE dgt_id=?",java.sql.Date.class,store).toLocalDate();}
 private Map<String,Object> lockAccess(String store,long id,String version){
  a.requireAdmin(store);a.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",a.company(store));a.requireAdmin(store);
  a.db.queryForList("SELECT employee_id FROM employees WHERE employee_id=? FOR UPDATE",id);
  var current=accessState(store,id);
  if(!Objects.equals(version,current.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Website access changed; close and reopen before confirming");
  if(current.get("user_id")==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"This employee has no website account");
  if(a.admin(((Number)current.get("user_id")).longValue(),a.company(store)))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Company admin access is managed through company ownership");
  return current;
 }
 private Object success(String store,long id){return Map.of("success",true,"version",accessState(store,id).get("version"));}
 @PostMapping("/{id}/end-website-access") @Transactional public Object endWebsiteAccess(@PathVariable String store,@PathVariable long id,@RequestBody EndAccessInput input){
  var current=lockAccess(store,id,input.version());
  if(input.endDate()==null||input.endDate().isBefore(today(store)))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose today or a future date for ending website access");
  if(!Boolean.TRUE.equals(current.get("active")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Website access has already ended; use Restore Website Access");
  a.db.update("UPDATE user_roles SET access_ends_on=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND dgt_id=? AND public.role_access_active(is_active,access_ends_on,dgt_id)",input.endDate(),current.get("user_id"),store);
  a.audit(store,"EMPLOYEE_WEBSITE_ACCESS_END_SCHEDULED",Long.toString(id),"{\"endDate\":\""+input.endDate()+"\"}");return success(store,id);
 }
 @PostMapping("/{id}/undo-website-access-ending") @Transactional public Object undoEnd(@PathVariable String store,@PathVariable long id,@RequestBody AccessVersion input){
  var current=lockAccess(store,id,input.version());
  if(current.get("access_ends_on")==null||!Boolean.TRUE.equals(current.get("active")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"There is no pending access ending to undo; use Restore Website Access if it already ended");
  a.db.update("UPDATE user_roles SET access_ends_on=NULL,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND dgt_id=? AND public.role_access_active(is_active,access_ends_on,dgt_id)",current.get("user_id"),store);
  a.audit(store,"EMPLOYEE_WEBSITE_ACCESS_END_CANCELLED",Long.toString(id),"{}");return success(store,id);
 }
 @PostMapping("/{id}/restore-website-access") @Transactional public Object restore(@PathVariable String store,@PathVariable long id,@RequestBody AccessVersion input){
  var current=lockAccess(store,id,input.version());
  if(Boolean.TRUE.equals(current.get("active")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Website access is already active; undo the pending ending instead");
  Object role=current.get("role_type_id");
  var roles=a.db.queryForList("SELECT role_type_id FROM role_types WHERE role_type_id=? AND is_active AND role_type_name IN ('CASHIER','MANAGER','ACCOUNTANT')",Long.class,role);
  if(roles.size()!=1)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose an active account role before restoring access");
  var previous=a.db.queryForList("SELECT xmin::text FROM user_roles WHERE user_id=? AND role_type_id=? AND dgt_id=?",String.class,current.get("user_id"),role,store);
  accounts.assignment(store,new RoleAssignmentRequest(((Number)current.get("user_id")).longValue(),roles.getFirst(),true,previous.isEmpty()?"0":previous.getFirst()));
  a.db.update("UPDATE user_roles SET is_active=(role_type_id=?),access_ends_on=NULL,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND dgt_id=?",role,current.get("user_id"),store);
  a.audit(store,"EMPLOYEE_WEBSITE_ACCESS_RESTORED",Long.toString(id),"{}");return success(store,id);
 }
 // Account setup and role selection; version must match the latest employee-access response.
 public record Input(String email,String password,long roleTypeId,boolean active,String version,String employeeCode){}
 // Authorize and lock the company, then update the employee account link and store roles atomically.
 @PutMapping("/{id}") @Transactional public Object save(@PathVariable String store,@PathVariable long id,@RequestBody Input in){
  a.requireAdmin(store);a.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",a.company(store));a.requireAdmin(store);
  var employees=a.db.queryForList("SELECT e.* FROM employees e WHERE employee_id=? AND EXISTS(SELECT 1 FROM employee_store_assignments esa WHERE esa.employee_id=e.employee_id AND esa.dgt_id=?) FOR UPDATE",id,store);
  if(employees.size()!=1)throw a.denied();var e=employees.getFirst();
  @SuppressWarnings("unchecked") var rows=(List<Map<String,Object>>)list(store);var row=rows.stream().filter(r->((Number)r.get("employee_id")).longValue()==id).findFirst().orElseThrow();
  // Reject edits based on a stale employee or role version.
  if(!Objects.equals(in.version(),row.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Access changed; reload before saving");
  // Company ownership controls admin access; this screen cannot change it.
  if(Boolean.TRUE.equals(row.get("admin")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Company admin access is managed through company ownership");
  var roles=a.db.queryForList("SELECT role_type_name FROM role_types WHERE role_type_id=? AND is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT')",String.class,in.roleTypeId());if(roles.size()!=1)throw a.denied();
  Long uid=(Long)e.get("user_id");
  // Create login access only after verifying administrator rights for every assigned store.
  if(uid==null){
   for(String target:a.db.queryForList("SELECT dgt_id FROM employee_store_assignments WHERE employee_id=?",String.class,id)){if(a.company(target)!=a.company(store))throw a.denied();a.requireAdmin(target);}
   var created=(Map<?,?>)accounts.createUser(store,new com.dgt.backend.access.dto.CreateAccessUserRequest((String)e.get("first_name"),(String)e.get("last_name"),Long.toString(id),in.email(),in.password(),in.roleTypeId(),List.of(store),List.of()));uid=((Number)created.get("userId")).longValue();
   a.db.update("UPDATE employees SET user_id=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=?",uid,id);
  }else{
   // Existing account passwords are changed through the profile workflow.
   if(in.password()!=null&&!in.password().isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Use profile settings to change an existing password");
   var previous=a.db.queryForList("SELECT xmin::text FROM user_roles WHERE user_id=? AND role_type_id=? AND dgt_id=?",String.class,uid,in.roleTypeId(),store);
   accounts.assignment(store,new com.dgt.backend.access.dto.RoleAssignmentRequest(uid,in.roleTypeId(),in.active(),previous.isEmpty()?"0":previous.getFirst()));
  }
  // Activate only the selected role for this store, or disable all roles when access is turned off.
  a.db.update("UPDATE user_roles SET is_active=(role_type_id=? AND ?),updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND dgt_id=?",in.roleTypeId(),in.active(),uid,store);
  a.db.update("UPDATE employee_store_assignments SET role_type_id=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=? AND dgt_id=?",in.roleTypeId(),id,store);
  a.audit(store,"EMPLOYEE_WEBSITE_ACCESS",Long.toString(id),"{}");return list(store);
 }
}
