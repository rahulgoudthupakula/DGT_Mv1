package com.dgt.backend.employees.controller;

import com.dgt.backend.access.*;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
import java.time.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/access/stores/{store}/employees")
@ConditionalOnProperty(name="app.workweek.enabled",havingValue="true")
public class StoreEmployeesController {
 private final ScopedAccess a;private final AccessController accounts;private final EmployeeDetails details;
 public StoreEmployeesController(ScopedAccess a,AccessController accounts,EmployeeDetails details){this.a=a;this.accounts=accounts;this.details=details;}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 private LocalDate today(String store){String zone=a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store);if(zone==null)throw bad("Store timezone required");return LocalDate.now(ZoneId.of(zone));}
 private List<Map<String,Object>> candidates(String store){return a.db.queryForList("SELECT u.user_id,u.first_name,u.last_name,u.email,rt.role_type_id,rt.role_type_name FROM users u JOIN user_roles ur USING(user_id) JOIN role_types rt USING(role_type_id) WHERE ur.dgt_id=? AND ur.is_active AND rt.is_active AND u.account_status='ACTIVE' ORDER BY u.first_name,u.user_id,rt.role_type_id",store);}
 private List<Map<String,Object>> rows(String store){LocalDate day=today(store);return a.db.queryForList("SELECT e.employee_id AS id,(SELECT count(*) FROM employee_store_assignments shared WHERE shared.employee_id=e.employee_id) AS store_count,e.user_id,e.hire_date,e.employee_type,coalesce(u.first_name,e.first_name) AS first_name,coalesce(u.last_name,e.last_name) AS last_name,u.email,coalesce(rt.role_type_name,'No website access') AS role,esa.job_title,CASE WHEN esa.department_id IS NOT NULL THEN 'default-'||esa.department_id WHEN esa.store_department_id IS NOT NULL THEN 'store-'||esa.store_department_id ELSE '' END AS department_key,coalesce((SELECT department_name FROM departments WHERE department_id=esa.department_id),(SELECT store_department_name FROM store_departments WHERE store_department_id=esa.store_department_id),'') AS dept,c.pay_type,coalesce(c.hourly_rate,c.annual_salary) AS rate,CASE WHEN esa.effective_from<=? AND (esa.effective_to IS NULL OR esa.effective_to>=?) AND (e.termination_date IS NULL OR e.termination_date>?) THEN 'Active' ELSE 'Inactive' END AS status,coalesce(u.xmin::text,'0') || ':' || e.xmin::text || ':' || esa.xmin::text || ':' || coalesce(c.xmin::text,'0') AS version FROM employees e LEFT JOIN users u USING(user_id) JOIN employee_store_assignments esa ON esa.employee_id=e.employee_id LEFT JOIN role_types rt ON rt.role_type_id=esa.role_type_id LEFT JOIN LATERAL (SELECT ec.*,ec.xmin FROM employee_compensation ec WHERE ec.archived_at IS NULL AND ec.employee_id=e.employee_id AND ec.effective_from<=? AND (ec.effective_to IS NULL OR ec.effective_to>=?) ORDER BY ec.effective_from DESC,ec.compensation_id DESC LIMIT 1) c ON true WHERE esa.dgt_id=? ORDER BY u.first_name,e.employee_id",day,day,day,day,day,store).stream().map(Rows::normalize).peek(details::enrich).toList();}
 @GetMapping public Object list(@PathVariable String store){a.requireAdmin(store);return Map.of("employees",rows(store),"users",candidates(store),"today",today(store),"departments",details.departments(store));}
 public record Input(Long userId,Long roleTypeId,String firstName,String lastName,String email,String password,String employeeCode,LocalDate hireDate,String employeeType,String payType,BigDecimal rate,String status,String version,EmployeeDetails.Input details,Boolean withoutAccess){}
 @PostMapping @Transactional public Object create(@PathVariable String store,@RequestBody Input in){return save(store,null,in);}
 @PutMapping("/{id}") @Transactional public Object update(@PathVariable String store,@PathVariable long id,@RequestBody Input in){return save(store,id,in);}
 private Object save(String store,Long id,Input in){
  a.requireAdmin(store);a.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",a.company(store));a.requireAdmin(store);
  LocalDate day=today(store);
  if(in.hireDate()==null||in.hireDate().isAfter(day))throw bad("Hire date must be today or earlier");
  if(!Set.of("Full-time","Part-time","Temporary").contains(in.employeeType()==null?"":in.employeeType()))throw bad("Choose an employee type");
  if(!Set.of("Hourly","Salary").contains(in.payType()==null?"":in.payType())||in.rate()==null||in.rate().signum()<0||in.rate().scale()>2||in.rate().compareTo(new BigDecimal("9999999999.99"))>0)throw bad("Choose pay type and a nonnegative rate with at most two decimals");
  if(!Set.of("Active","Inactive").contains(in.status()==null?"":in.status()))throw bad("Choose a valid status");
  if(in.status().equals("Inactive")&&!in.hireDate().isBefore(day))throw bad("An inactive employee's hire date must be before today");
  Long uid;Long role;Map<String,Object> identity=null;String first=null,last=null,email=null;
  if(id==null){
   if(Boolean.TRUE.equals(in.withoutAccess())){
    if(in.firstName()==null||in.firstName().isBlank()||in.firstName().length()>100||in.lastName()==null||in.lastName().isBlank()||in.lastName().length()>100)throw bad("First and last name required, maximum 100 characters each");
    uid=null;role=null;
   }else if(in.userId()==null){
    role=a.db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER' AND is_active",Long.class);
    var created=(Map<?,?>)accounts.createUser(store,new AccessController.NewUser(in.firstName(),in.lastName(),in.employeeCode(),in.email(),in.password(),role,List.of(store),List.of()));uid=((Number)created.get("userId")).longValue();
   }else{uid=in.userId();var choices=candidates(store).stream().filter(r->((Number)r.get("user_id")).longValue()==uid.longValue()&&Objects.equals(r.get("role_type_id"),in.roleTypeId())).toList();if(choices.isEmpty())throw a.denied();role=((Number)choices.getFirst().get("role_type_id")).longValue();}
   a.db.queryForList("SELECT user_id FROM users WHERE user_id=? FOR UPDATE",uid);
   var existing=a.db.queryForList("SELECT employee_id FROM employees WHERE user_id=?",Long.class,uid);
   if(!existing.isEmpty())throw new ResponseStatusException(HttpStatus.CONFLICT,"This user already has an employee record. Multi-store employee assignment needs a separate workflow.");
   id=a.db.queryForObject("INSERT INTO employees(user_id,hire_date,employee_type,first_name,last_name) VALUES (?,?,?,?,?) RETURNING employee_id",Long.class,uid,in.hireDate(),in.employeeType(),uid==null?in.firstName().strip():null,uid==null?in.lastName().strip():null);
   a.db.update("INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,effective_to,role_type_id) VALUES (?,?,true,?,?,?)",id,store,in.hireDate(),in.status().equals("Inactive")?day.minusDays(1):null,role);
  }else{
   a.db.queryForList("SELECT employee_id FROM employees WHERE employee_id=? FOR UPDATE",id);
   uid=a.db.queryForObject("SELECT user_id FROM employees WHERE employee_id=?",Long.class,id);
   if(uid!=null)identity=a.db.queryForMap("SELECT user_id,first_name,last_name,email,dgt_id FROM users WHERE user_id=? FOR UPDATE",uid);
   long employee=id;var found=rows(store).stream().filter(r->((Number)r.get("id")).longValue()==employee).toList();if(found.size()!=1)throw a.denied();var current=found.getFirst();
   if(!Objects.equals(in.version(),current.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Employee changed; close and reopen before saving");
   for(var target:a.db.queryForList("SELECT dgt_id FROM employee_store_assignments WHERE employee_id=?",String.class,id)){
    if(a.company(target)!=a.company(store))throw bad("Employee belongs to another company; contact support before editing");
    a.requireAdmin(target);
   }
   if(identity!=null){
   first=in.firstName()==null?(String)identity.get("first_name"):in.firstName().strip();
   last=in.lastName()==null?(String)identity.get("last_name"):in.lastName().strip();
   email=in.email()==null?(String)identity.get("email"):in.email().strip().toLowerCase(Locale.ROOT);
   if(first.isEmpty()||first.length()>100||last.isEmpty()||last.length()>100||email.length()>255||!email.matches("[^\\s@:]+@[^\\s@]+\\.[^\\s@]+"))throw bad("Enter first name, last name and a valid email");
   if(!first.equals(identity.get("first_name"))||!last.equals(identity.get("last_name"))||!email.equals(identity.get("email"))){
    var companies=a.db.queryForList("SELECT company_id FROM company_admins WHERE user_id=? UNION SELECT s.company_id FROM user_roles ur JOIN stores s ON s.dgt_id=ur.dgt_id WHERE ur.user_id=? UNION SELECT company_id FROM stores WHERE dgt_id=?",Long.class,uid,uid,identity.get("dgt_id"));
    for(Long company:companies)if(company==null||!a.admin(a.user(),company))throw a.denied();
    if(Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM users WHERE lower(email)=? AND user_id<>?)",Boolean.class,email,uid)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Email is already in use");
   }
   }else{
    first=in.firstName()==null?(String)current.get("first_name"):in.firstName().strip();last=in.lastName()==null?(String)current.get("last_name"):in.lastName().strip();
    if(first==null||first.isBlank()||first.length()>100||last==null||last.isBlank()||last.length()>100)throw bad("First and last name required");
    a.db.update("UPDATE employees SET first_name=?,last_name=? WHERE employee_id=?",first,last,id);
   }
   if(Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM employee_compensation WHERE employee_compensation.archived_at IS NULL AND employee_id=? AND effective_from>?)",Boolean.class,id,day)))throw bad("Future pay changes already exist; review them before editing");
   a.db.update("UPDATE employees SET hire_date=?,employee_type=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=?",in.hireDate(),in.employeeType(),id);
   a.db.update("UPDATE employee_store_assignments SET effective_from=?,effective_to=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=? AND dgt_id=?",in.hireDate(),in.status().equals("Inactive")?day.minusDays(1):null,id,store);
  }
  var pay=a.db.queryForList("SELECT * FROM employee_compensation WHERE employee_compensation.archived_at IS NULL AND employee_id=? AND effective_from<=? AND (effective_to IS NULL OR effective_to>=?) ORDER BY effective_from DESC,compensation_id DESC",id,day,day);
  if(pay.size()>1)throw bad("Overlapping pay records require review");
  if(!pay.isEmpty()&&Objects.equals(pay.getFirst().get("pay_type"),in.payType())&&in.rate().compareTo((BigDecimal)pay.getFirst().get(in.payType().equals("Hourly")?"hourly_rate":"annual_salary"))==0){/* unchanged */}
  else{
   if(!pay.isEmpty()&&((java.sql.Date)pay.getFirst().get("effective_from")).toLocalDate().equals(day))a.db.update("UPDATE employee_compensation SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND compensation_id=?",pay.getFirst().get("compensation_id"));
   else if(!pay.isEmpty())a.db.update("UPDATE employee_compensation SET effective_to=?,updated_at=CURRENT_TIMESTAMP WHERE compensation_id=?",day.minusDays(1),pay.getFirst().get("compensation_id"));
   a.db.update("INSERT INTO employee_compensation(employee_id,pay_type,hourly_rate,annual_salary,effective_from) VALUES (?,?,?,?,?)",id,in.payType(),in.payType().equals("Hourly")?in.rate():null,in.payType().equals("Salary")?in.rate():null,day);
  }
  details.save(store,id,in.details());
  a.audit(store,"EMPLOYEE_SAVED",id.toString(),"{}");
  boolean signInAgain=false;
  if(identity!=null){
   boolean changedEmail=!email.equals(identity.get("email"));signInAgain=changedEmail&&uid==a.user();
   try{a.db.update("UPDATE users SET first_name=?,last_name=?,email=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",first,last,email,uid);}
   catch(org.springframework.dao.DuplicateKeyException ex){throw new ResponseStatusException(HttpStatus.CONFLICT,"Email is already in use");}
   if(changedEmail)a.db.update("UPDATE user_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL",uid);
  }
  return Map.of("employees",rows(store),"users",candidates(store),"today",day,"signInAgain",signInAgain,"departments",details.departments(store));
 }
}
