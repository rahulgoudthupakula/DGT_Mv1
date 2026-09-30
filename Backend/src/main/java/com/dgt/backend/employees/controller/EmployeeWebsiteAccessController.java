package com.dgt.backend.employees.controller;
import com.dgt.backend.access.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController
@RequestMapping("/api/v1/access/stores/{store}/employee-access")
@ConditionalOnProperty(name="app.workweek.enabled",havingValue="true")
public class EmployeeWebsiteAccessController {
 private final ScopedAccess a;private final AccessController accounts;
 public EmployeeWebsiteAccessController(ScopedAccess a,AccessController accounts){this.a=a;this.accounts=accounts;}
 @GetMapping public Object list(@PathVariable String store){a.requireAdmin(store);return a.db.queryForList("SELECT e.employee_id,e.user_id,coalesce(esa.job_title,'') AS job_role,coalesce(u.first_name,e.first_name) AS first_name,coalesce(u.last_name,e.last_name) AS last_name,u.email,EXISTS(SELECT 1 FROM company_admins ca WHERE ca.user_id=e.user_id AND ca.company_id=s.company_id AND ca.is_active) AS admin,e.xmin::text || ':' || coalesce((SELECT string_agg(ur.user_role_id::text || '-' || ur.xmin::text,',' ORDER BY ur.user_role_id) FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=?),'0') AS version,(SELECT ur.role_type_id FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=? ORDER BY ur.is_active DESC,ur.user_role_id LIMIT 1) AS role_type_id,EXISTS(SELECT 1 FROM user_roles ur WHERE ur.user_id=e.user_id AND ur.dgt_id=? AND ur.is_active) AS active FROM employees e JOIN employee_store_assignments esa ON esa.employee_id=e.employee_id JOIN stores s ON s.dgt_id=esa.dgt_id LEFT JOIN users u ON u.user_id=e.user_id WHERE esa.dgt_id=? ORDER BY coalesce(u.first_name,e.first_name),e.employee_id",store,store,store,store);}
 public record Input(String email,String password,long roleTypeId,boolean active,String version,String employeeCode){}
 @PutMapping("/{id}") @Transactional public Object save(@PathVariable String store,@PathVariable long id,@RequestBody Input in){
  a.requireAdmin(store);a.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",a.company(store));a.requireAdmin(store);
  var employees=a.db.queryForList("SELECT e.* FROM employees e WHERE employee_id=? AND EXISTS(SELECT 1 FROM employee_store_assignments esa WHERE esa.employee_id=e.employee_id AND esa.dgt_id=?) FOR UPDATE",id,store);
  if(employees.size()!=1)throw a.denied();var e=employees.getFirst();
  @SuppressWarnings("unchecked") var rows=(List<Map<String,Object>>)list(store);var row=rows.stream().filter(r->((Number)r.get("employee_id")).longValue()==id).findFirst().orElseThrow();
  if(!Objects.equals(in.version(),row.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Access changed; reload before saving");
  if(Boolean.TRUE.equals(row.get("admin")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Company admin access is managed through company ownership");
  var roles=a.db.queryForList("SELECT role_type_name FROM role_types WHERE role_type_id=? AND is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT')",String.class,in.roleTypeId());if(roles.size()!=1)throw a.denied();
  Long uid=(Long)e.get("user_id");
  if(uid==null){
   for(String target:a.db.queryForList("SELECT dgt_id FROM employee_store_assignments WHERE employee_id=?",String.class,id)){if(a.company(target)!=a.company(store))throw a.denied();a.requireAdmin(target);}
   var created=(Map<?,?>)accounts.createUser(store,new AccessController.NewUser((String)e.get("first_name"),(String)e.get("last_name"),Long.toString(id),in.email(),in.password(),in.roleTypeId(),List.of(store),List.of()));uid=((Number)created.get("userId")).longValue();
   a.db.update("UPDATE employees SET user_id=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=?",uid,id);
  }else{
   if(in.password()!=null&&!in.password().isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Use profile settings to change an existing password");
   var previous=a.db.queryForList("SELECT xmin::text FROM user_roles WHERE user_id=? AND role_type_id=? AND dgt_id=?",String.class,uid,in.roleTypeId(),store);
   accounts.assignment(store,new AccessController.Assignment(uid,in.roleTypeId(),in.active(),previous.isEmpty()?"0":previous.getFirst()));
  }
  a.db.update("UPDATE user_roles SET is_active=(role_type_id=? AND ?),updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND dgt_id=?",in.roleTypeId(),in.active(),uid,store);
  a.db.update("UPDATE employee_store_assignments SET role_type_id=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=? AND dgt_id=?",in.roleTypeId(),id,store);
  a.audit(store,"EMPLOYEE_WEBSITE_ACCESS",Long.toString(id),"{}");return list(store);
 }
}
