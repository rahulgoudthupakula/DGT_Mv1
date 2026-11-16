package com.dgt.backend.employees.controller;

import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.service.AccessService;

import com.dgt.backend.access.dto.CreateAccessUserRequest;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
import java.time.*;
import java.math.BigDecimal;
import lombok.extern.slf4j.Slf4j;

/**
 * Store-admin employee management, enabled by app.workweek.enabled.
 * Coordinates employee identity, store assignment, effective pay history, and optional website accounts.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/access/stores/{store}/employees")
@ConditionalOnProperty(name="app.workweek.enabled",havingValue="true")
public class StoreEmployeesController {
 private final ScopedAccess a;private final AccessService accounts;private final EmployeeDetails details;private final EmployeeDocumentStorage documents;
 public StoreEmployeesController(ScopedAccess a,AccessService accounts,EmployeeDetails details,EmployeeDocumentStorage documents){this.a=a;this.accounts=accounts;this.details=details;this.documents=documents;}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 // Use the store timezone for hire-date checks, assignment status, and effective pay dates.
 private LocalDate today(String store){String zone=a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store);if(zone==null)throw bad("Store timezone required");return LocalDate.now(ZoneId.of(zone));}
 // List active store account/role combinations available for linking an employee.
 private List<Map<String,Object>> candidates(String store){return a.db.queryForList("SELECT u.user_id,u.first_name,u.last_name,u.email,rt.role_type_id,rt.role_type_name FROM users u JOIN user_roles ur USING(user_id) JOIN role_types rt USING(role_type_id) WHERE ur.dgt_id=? AND public.role_access_active(ur.is_active,ur.access_ends_on,ur.dgt_id) AND rt.is_active AND u.account_status='ACTIVE' ORDER BY u.first_name,u.user_id,rt.role_type_id",store);}
 // The list selects table/action fields only; detail queries target exactly one employee.
 private List<Map<String,Object>> rows(String store){return queryRows(store,null,false);}
 private Map<String,Object> row(String store,long id){return queryRows(store,id,false).stream().findFirst().orElseThrow(a::denied);}
 private List<Map<String,Object>> queryRows(String store,Long employeeId,boolean full){
  LocalDate day=today(store);
  String detailColumns=full?"(SELECT count(*) FROM employee_store_assignments shared WHERE shared.employee_id=e.employee_id) AS store_count,e.hire_date,e.employee_type,u.email,CASE WHEN esa.department_id IS NOT NULL THEN 'default-'||esa.department_id WHEN esa.store_department_id IS NOT NULL THEN 'store-'||esa.store_department_id ELSE '' END AS department_key,":"";
  var args=new ArrayList<Object>(Arrays.asList(day,day,day,day,day,store));if(employeeId!=null)args.add(employeeId);
  return a.db.queryForList("SELECT e.employee_id AS id,"+detailColumns+"e.user_id,esa.effective_to AS last_working_date,EXISTS(SELECT 1 FROM user_roles ar JOIN role_types art USING(role_type_id) WHERE ar.user_id=e.user_id AND ar.dgt_id=esa.dgt_id AND public.role_access_active(ar.is_active,ar.access_ends_on,ar.dgt_id) AND art.is_active AND u.account_status='ACTIVE') AS website_access_active,EXISTS(SELECT 1 FROM company_admins ca JOIN stores cs ON cs.company_id=ca.company_id WHERE cs.dgt_id=esa.dgt_id AND ca.user_id=e.user_id AND ca.is_active) AS website_access_admin,coalesce(u.first_name,e.first_name) AS first_name,coalesce(u.last_name,e.last_name) AS last_name,coalesce(rt.role_type_name,'No website access') AS role,esa.job_title,coalesce((SELECT store_department_name FROM store_departments WHERE department_id=esa.department_id AND dgt_id=esa.dgt_id),(SELECT store_department_name FROM store_departments WHERE store_department_id=esa.store_department_id),'') AS dept,c.pay_type,coalesce(c.hourly_rate,c.annual_salary) AS rate,CASE WHEN esa.effective_from<=? AND (esa.effective_to IS NULL OR esa.effective_to>=?) AND (e.termination_date IS NULL OR e.termination_date>?) THEN 'Active' ELSE 'Inactive' END AS status,coalesce(u.xmin::text,'0') || ':' || e.xmin::text || ':' || esa.xmin::text || ':' || coalesce(c.xmin::text,'0') || ':' || coalesce((SELECT string_agg(ar.user_role_id::text || '-' || ar.xmin::text,',' ORDER BY ar.user_role_id) FROM user_roles ar WHERE ar.user_id=e.user_id AND ar.dgt_id=esa.dgt_id),'0') AS version FROM employees e LEFT JOIN users u USING(user_id) JOIN employee_store_assignments esa ON esa.employee_id=e.employee_id LEFT JOIN role_types rt ON rt.role_type_id=esa.role_type_id LEFT JOIN LATERAL (SELECT ec.*,ec.xmin FROM employee_compensation ec WHERE ec.archived_at IS NULL AND ec.employee_id=e.employee_id AND ec.effective_from<=? AND (ec.effective_to IS NULL OR ec.effective_to>=?) ORDER BY ec.effective_from DESC,ec.compensation_id DESC LIMIT 1) c ON true WHERE esa.dgt_id=?"+(employeeId==null?"":" AND e.employee_id=?")+" ORDER BY u.first_name,e.employee_id",args.toArray()).stream().map(Rows::normalize).toList();
 }
 @GetMapping("/{id}") public Object detail(@PathVariable String store,@PathVariable long id){
  a.requireAdmin(store);var employee=queryRows(store,id,true).stream().findFirst().orElseThrow(a::denied);details.enrich(employee);employee.put("employment_history",a.db.queryForList("SELECT hired_on,ended_on FROM employee_employment_periods WHERE employee_id=? AND dgt_id=? ORDER BY employment_period_id DESC",id,store).stream().map(Rows::normalize).toList());return employee;
 }
 // Return the admin employee page data and store-local date.
 @GetMapping public Object list(@PathVariable String store){a.requireAdmin(store);return Map.of("employees",rows(store),"today",today(store));}
 // Small lookup used only by the Add Employee form; company admins grant these store roles.
 @GetMapping("/account-roles") public Object accountRoles(@PathVariable String store){a.requireAdmin(store);return a.db.queryForList("SELECT role_type_id AS id,role_type_name AS name FROM role_types WHERE is_active AND role_type_name IN ('CASHIER','MANAGER','ACCOUNTANT') ORDER BY role_type_name");}
 // Count live shifts extending beyond the chosen last day; never cancel them implicitly.
 private int futureShifts(String store,long id,LocalDate lastDay){
  String timezone=a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store);
  var cutoff=lastDay.plusDays(1).atStartOfDay(ZoneId.of(timezone)).toOffsetDateTime();
  return a.db.queryForObject("SELECT count(*) FROM employee_schedules WHERE dgt_id=? AND employee_id=? AND status IN ('DRAFT','PUBLISHED','NEEDS_COVERAGE') AND schedule_end>? AND schedule_end>CURRENT_TIMESTAMP",Integer.class,store,id,cutoff);
 }
 @GetMapping("/{id}/inactivation-preview") public Object inactivationPreview(@PathVariable String store,@PathVariable long id,@RequestParam LocalDate lastWorkingDate){
  a.requireAdmin(store);
  if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM employee_store_assignments WHERE employee_id=? AND dgt_id=?)",Boolean.class,id,store)))throw a.denied();
  return Map.of("futureShiftCount",futureShifts(store,id,lastWorkingDate),"inactiveFrom",lastWorkingDate.plusDays(1));
 }
 public record AssignmentInput(Boolean reactivate,LocalDate lastWorkingDate,Boolean disableWebsiteAccess,Boolean acknowledgeFutureShifts,String version,LocalDate rehireDate){}
 // Change only this store assignment; shared identity and compensation remain untouched.
 @PutMapping("/{id}/assignment") @Transactional public Object assignment(@PathVariable String store,@PathVariable long id,@RequestBody AssignmentInput in){
  a.requireAdmin(store);a.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",a.company(store));a.requireAdmin(store);
  a.db.queryForList("SELECT employee_id FROM employees WHERE employee_id=? FOR UPDATE",id);
  var current=row(store,id);
  if(!Objects.equals(in.version(),current.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Employee changed; close and reopen before saving");
  var employee=a.db.queryForMap("SELECT * FROM employees WHERE employee_id=?",id);
  var assignment=a.db.queryForMap("SELECT effective_from,effective_to FROM employee_store_assignments WHERE employee_id=? AND dgt_id=?",id,store);
  LocalDate periodStart=((java.sql.Date)assignment.get("effective_from")).toLocalDate();
  LocalDate rehire=in.rehireDate()==null?today(store):in.rehireDate();
  if(Boolean.TRUE.equals(in.reactivate())){
   var ended=(java.sql.Date)assignment.get("effective_to");
   if(ended==null||!ended.toLocalDate().isBefore(today(store)))throw bad("Only an employee whose employment has ended can be rehired");
   if(rehire.isAfter(today(store))||!rehire.isAfter(ended.toLocalDate()))throw bad("Choose a rehire date after the last working date and no later than today");
   if(Boolean.TRUE.equals(in.disableWebsiteAccess()))throw bad("Reactivation does not change website access");
   var termination=(java.sql.Date)employee.get("termination_date");
   if(termination!=null&&!termination.toLocalDate().isAfter(today(store)))throw bad("Employment has a termination date; review it before reactivating this store assignment");
  }else{
   if(in.lastWorkingDate()==null||in.lastWorkingDate().isBefore(periodStart))throw bad("Choose a last working date on or after the hire date");
   if(futureShifts(store,id,in.lastWorkingDate())>0&&!Boolean.TRUE.equals(in.acknowledgeFutureShifts()))throw bad("Confirm that shifts after the last working date must be reviewed separately");
   if(Boolean.TRUE.equals(in.disableWebsiteAccess())){
    Long uid=(Long)employee.get("user_id");if(uid==null)throw bad("This employee has no website account");
    if(a.admin(uid,a.company(store)))throw bad("Company admin access is managed through company ownership");
    a.db.update("UPDATE user_roles SET is_active=false,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND dgt_id=?",uid,store);
    a.audit(store,"EMPLOYEE_WEBSITE_ACCESS_DISABLED",Long.toString(id),"{}");
   }
  }
  ensureEmploymentPeriod(store,id);
  if(Boolean.TRUE.equals(in.reactivate())){
   a.db.update("INSERT INTO employee_employment_periods(employee_id,dgt_id,hired_on) VALUES (?,?,?)",id,store,rehire);
   a.db.update("UPDATE employee_store_assignments SET effective_from=?,effective_to=NULL,updated_at=CURRENT_TIMESTAMP WHERE employee_id=? AND dgt_id=?",rehire,id,store);
  }else{
   a.db.update("UPDATE employee_employment_periods SET ended_on=? WHERE employment_period_id=(SELECT max(employment_period_id) FROM employee_employment_periods WHERE employee_id=? AND dgt_id=?)",in.lastWorkingDate(),id,store);
   a.db.update("UPDATE employee_store_assignments SET effective_to=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=? AND dgt_id=?",in.lastWorkingDate(),id,store);
  }
  a.audit(store,Boolean.TRUE.equals(in.reactivate())?"EMPLOYEE_ASSIGNMENT_REACTIVATED":"EMPLOYEE_ASSIGNMENT_ENDED",Long.toString(id),"{}");return Map.of("success",true,"version",row(store,id).get("version"));
 }
 private void ensureEmploymentPeriod(String store,long id){a.db.update("INSERT INTO employee_employment_periods(employee_id,dgt_id,hired_on,ended_on) SELECT employee_id,dgt_id,effective_from,effective_to FROM employee_store_assignments esa WHERE employee_id=? AND dgt_id=? AND NOT EXISTS(SELECT 1 FROM employee_employment_periods p WHERE p.employee_id=esa.employee_id AND p.dgt_id=esa.dgt_id)",id,store);}
 // Employee form values; withoutAccess permits an employee without a website user account.
 public record Input(Long userId,Long roleTypeId,String firstName,String lastName,String email,String password,String employeeCode,LocalDate hireDate,String employeeType,String payType,BigDecimal rate,String status,String version,EmployeeDetails.Input details,Boolean withoutAccess,LocalDate lastWorkingDate,Boolean disableWebsiteAccess,Boolean acknowledgeFutureShifts){}
 // Create the employee and related records within one transaction.
 @PostMapping(consumes="application/json") @Transactional public Object create(@PathVariable String store,@RequestBody Input in){return save(store,null,in);}
 // Update an employee through the same transactional validation workflow.
 @PutMapping(value="/{id}",consumes="application/json") @Transactional public Object update(@PathVariable String store,@PathVariable long id,@RequestBody Input in){return save(store,id,in);}
 @PostMapping(consumes="multipart/form-data") @Transactional public Object createWithDocuments(@PathVariable String store,@RequestPart("employee") Input input,@RequestPart("files") List<org.springframework.web.multipart.MultipartFile> files,@RequestPart("documentTypes") List<String> types){return saveWithDocuments(store,null,input,files,types);}
 @PutMapping(value="/{id}",consumes="multipart/form-data") @Transactional public Object updateWithDocuments(@PathVariable String store,@PathVariable long id,@RequestPart("employee") Input input,@RequestPart("files") List<org.springframework.web.multipart.MultipartFile> files,@RequestPart("documentTypes") List<String> types){return saveWithDocuments(store,id,input,files,types);}
 private Object saveWithDocuments(String store,Long id,Input input,List<org.springframework.web.multipart.MultipartFile> files,List<String> types){var result=(Map<?,?>)save(store,id,input);documents.save(((Number)result.get("employeeId")).longValue(),files,types);return result;}
 @GetMapping("/{id}/documents/{documentId}/download") public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable String store,@PathVariable long id,@PathVariable long documentId){
  a.requireAdmin(store);row(store,id);
  var found=a.db.queryForList("SELECT document_name,document_url FROM employee_documents WHERE employee_id=? AND employee_document_id=?",id,documentId);
  if(found.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Document not found");
  var document=found.getFirst();var file=documents.file((String)document.get("document_url"));
  String contentType=file.toString().endsWith(".pdf")?"application/pdf":file.toString().endsWith(".png")?"image/png":"image/jpeg";
  return org.springframework.http.ResponseEntity.ok().header("Cache-Control","no-store").header("X-Content-Type-Options","nosniff").header("Content-Disposition",org.springframework.http.ContentDisposition.attachment().filename((String)document.get("document_name"),java.nio.charset.StandardCharsets.UTF_8).build().toString()).contentType(org.springframework.http.MediaType.parseMediaType(contentType)).body(new org.springframework.core.io.FileSystemResource(file));
 }
 // Lock the company and recheck admin rights before validating or changing employee data.
 private Object save(String store,Long id,Input in){
  a.requireAdmin(store);a.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",a.company(store));a.requireAdmin(store);
  LocalDate day=today(store);
  if(id==null&&(in.details()==null||in.details().jobTitle()==null||in.details().jobTitle().isBlank()))throw bad("Job role is required");
  if(in.hireDate()==null||in.hireDate().isAfter(day))throw bad("Hire date must be today or earlier");
  if(!Set.of("Full-time","Part-time","Temporary").contains(in.employeeType()==null?"":in.employeeType()))throw bad("Choose an employee type");
  if(!Set.of("Hourly","Salary").contains(in.payType()==null?"":in.payType())||in.rate()==null||in.rate().signum()<0||in.rate().scale()>2||in.rate().compareTo(new BigDecimal("9999999999.99"))>0)throw bad("Choose pay type and a nonnegative rate with at most two decimals");
  String status=id==null?"Active":in.status();
  if(!Set.of("Active","Inactive").contains(status==null?"":status))throw bad("Choose a valid status");
  LocalDate lastDay=status.equals("Inactive")?in.lastWorkingDate():null;
  if(status.equals("Inactive")&&(lastDay==null||lastDay.isBefore(in.hireDate())))throw bad("Choose a last working date on or after the hire date");
  if(Boolean.TRUE.equals(in.disableWebsiteAccess())&&(id==null||!status.equals("Inactive")))throw bad("Website access can only be disabled while ending an existing assignment");
  Long uid;Long role;Long reservedEmployeeId=null;Map<String,Object> identity=null;String first=null,last=null,email=null;
  if(id==null){
   // A payroll-only employee keeps names on the employee record and has no user or website role.
   if(Boolean.TRUE.equals(in.withoutAccess())){
    if(in.userId()!=null||in.roleTypeId()!=null||in.email()!=null&&!in.email().isBlank()||in.password()!=null&&!in.password().isBlank())throw bad("No-access employees must not include login credentials or a website role");
    if(in.firstName()==null||in.firstName().isBlank()||in.firstName().length()>100||in.lastName()==null||in.lastName().isBlank()||in.lastName().length()>100)throw bad("First and last name required, maximum 100 characters each");
    uid=null;role=null;
   // Preserve the legacy default while honoring an explicitly selected, active staff role.
   }else if(in.userId()==null||(in.email()!=null&&in.password()!=null)){
    var roles=in.roleTypeId()==null?a.db.queryForList("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER' AND is_active",Long.class):a.db.queryForList("SELECT role_type_id FROM role_types WHERE role_type_id=? AND is_active AND role_type_name IN ('CASHIER','MANAGER','ACCOUNTANT')",Long.class,in.roleTypeId());
    if(roles.size()!=1)throw bad("Choose an active Cashier, Manager, or Accountant role");role=roles.getFirst();
    // Reserve the employee ID so accounts use the same identifier without asking for another code.
    reservedEmployeeId=a.db.queryForObject("SELECT nextval(pg_get_serial_sequence('public.employees','employee_id'))",Long.class);
    String code=in.employeeCode()==null||in.employeeCode().isBlank()?reservedEmployeeId.toString():in.employeeCode();
    var created=(Map<?,?>)accounts.createUser(store,new com.dgt.backend.access.dto.CreateAccessUserRequest(in.firstName(),in.lastName(),code,in.email(),in.password(),role,List.of(store),List.of()));uid=((Number)created.get("userId")).longValue();
   }else{uid=in.userId();var choices=candidates(store).stream().filter(r->((Number)r.get("user_id")).longValue()==uid.longValue()&&Objects.equals(r.get("role_type_id"),in.roleTypeId())).toList();if(choices.isEmpty())throw a.denied();role=((Number)choices.getFirst().get("role_type_id")).longValue();}
   a.db.queryForList("SELECT user_id FROM users WHERE user_id=? FOR UPDATE",uid);
   var existing=a.db.queryForList("SELECT employee_id FROM employees WHERE user_id=?",Long.class,uid);
   if(!existing.isEmpty())throw new ResponseStatusException(HttpStatus.CONFLICT,"This user already has an employee record. Multi-store employee assignment needs a separate workflow.");
   if(reservedEmployeeId!=null)id=a.db.queryForObject("INSERT INTO employees(employee_id,user_id,hire_date,employee_type) VALUES (?,?,?,?) RETURNING employee_id",Long.class,reservedEmployeeId,uid,in.hireDate(),in.employeeType());
   else id=a.db.queryForObject("INSERT INTO employees(user_id,hire_date,employee_type,first_name,last_name) VALUES (?,?,?,?,?) RETURNING employee_id",Long.class,uid,in.hireDate(),in.employeeType(),uid==null?in.firstName().strip():null,uid==null?in.lastName().strip():null);
   a.db.update("INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,effective_to,role_type_id) VALUES (?,?,true,?,?,?)",id,store,in.hireDate(),lastDay,role);
  }else{
   a.db.queryForList("SELECT employee_id FROM employees WHERE employee_id=? FOR UPDATE",id);
   uid=a.db.queryForObject("SELECT user_id FROM employees WHERE employee_id=?",Long.class,id);
   if(uid!=null)identity=a.db.queryForMap("SELECT user_id,first_name,last_name,email,dgt_id FROM users WHERE user_id=? FOR UPDATE",uid);
   var current=row(store,id);
   // Reject concurrent changes to identity, employee, assignment, or current compensation.
   if(!Objects.equals(in.version(),current.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Employee changed; close and reopen before saving");
   if(lastDay!=null&&!lastDay.toString().equals(Objects.toString(current.get("last_working_date"),""))&&futureShifts(store,id,lastDay)>0&&!Boolean.TRUE.equals(in.acknowledgeFutureShifts()))throw bad("Confirm that shifts after the last working date must be reviewed separately");
   if(Boolean.TRUE.equals(in.disableWebsiteAccess())){
    if(uid==null)throw bad("This employee has no website account");
    if(a.admin(uid,a.company(store)))throw bad("Company admin access is managed through company ownership");
    a.db.update("UPDATE user_roles SET is_active=false,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND dgt_id=?",uid,store);
    a.audit(store,"EMPLOYEE_WEBSITE_ACCESS_DISABLED",id.toString(),"{}");
   }
   // Shared employee changes require admin rights for every assignment in the same company.
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
    // Changing shared login identity requires admin rights across its related companies.
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
   LocalDate originalHire=a.db.queryForObject("SELECT hire_date FROM employees WHERE employee_id=?",java.sql.Date.class,id).toLocalDate();
   a.db.update("UPDATE employees SET hire_date=?,employee_type=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=?",in.hireDate(),in.employeeType(),id);
   boolean rehired=a.db.queryForObject("SELECT count(*)>1 FROM employee_employment_periods WHERE employee_id=? AND dgt_id=?",Boolean.class,id,store);
   if(rehired&&!in.hireDate().equals(originalHire))throw bad("Original hire date cannot be changed after rehire");
   LocalDate assignmentStart=rehired?a.db.queryForObject("SELECT effective_from FROM employee_store_assignments WHERE employee_id=? AND dgt_id=?",java.sql.Date.class,id,store).toLocalDate():in.hireDate();
   if(lastDay!=null&&lastDay.isBefore(assignmentStart))throw bad("Last working date must be on or after the current hire or rehire date");
   a.db.update("UPDATE employee_store_assignments SET effective_from=?,effective_to=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=? AND dgt_id=?",assignmentStart,lastDay,id,store);
   a.db.update("UPDATE employee_employment_periods SET hired_on=?,ended_on=? WHERE employment_period_id=(SELECT max(employment_period_id) FROM employee_employment_periods WHERE employee_id=? AND dgt_id=?)",assignmentStart,lastDay,id,store);
  }
  // Find effective pay records for today; overlapping records require manual review.
  var pay=a.db.queryForList("SELECT * FROM employee_compensation WHERE employee_compensation.archived_at IS NULL AND employee_id=? AND effective_from<=? AND (effective_to IS NULL OR effective_to>=?) ORDER BY effective_from DESC,compensation_id DESC",id,day,day);
  if(pay.size()>1)throw bad("Overlapping pay records require review");
  if(!pay.isEmpty()&&Objects.equals(pay.getFirst().get("pay_type"),in.payType())&&in.rate().compareTo((BigDecimal)pay.getFirst().get(in.payType().equals("Hourly")?"hourly_rate":"annual_salary"))==0){/* unchanged */}
  else{
   // Archive a same-day pay replacement; otherwise end the previous rate yesterday.
   if(!pay.isEmpty()&&((java.sql.Date)pay.getFirst().get("effective_from")).toLocalDate().equals(day))a.db.update("UPDATE employee_compensation SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND compensation_id=?",pay.getFirst().get("compensation_id"));
   else if(!pay.isEmpty())a.db.update("UPDATE employee_compensation SET effective_to=?,updated_at=CURRENT_TIMESTAMP WHERE compensation_id=?",day.minusDays(1),pay.getFirst().get("compensation_id"));
   a.db.update("INSERT INTO employee_compensation(employee_id,pay_type,hourly_rate,annual_salary,effective_from) VALUES (?,?,?,?,?)",id,in.payType(),in.payType().equals("Hourly")?in.rate():null,in.payType().equals("Salary")?in.rate():null,day);
  }
  // Persist job/deposit/deduction details in the employee transaction.
  details.save(store,id,in.details());
  ensureEmploymentPeriod(store,id);
  a.audit(store,"EMPLOYEE_SAVED",id.toString(),"{}");
  boolean signInAgain=false;
  if(identity!=null){
   boolean changedEmail=!email.equals(identity.get("email"));signInAgain=changedEmail&&uid==a.user();
   try{a.db.update("UPDATE users SET first_name=?,last_name=?,email=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",first,last,email,uid);}
   catch(org.springframework.dao.DuplicateKeyException ex){throw new ResponseStatusException(HttpStatus.CONFLICT,"Email is already in use");}
   // Revoke stored user_sessions after an email change; this is not a blanket JWT revocation.
   if(changedEmail)a.db.update("UPDATE user_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL",uid);
  }
  var result=new LinkedHashMap<String,Object>();result.put("success",true);result.put("employeeId",id);result.put("signInAgain",signInAgain);
  result.put("userId",uid);result.put("version",row(store,id).get("version"));
  return result;
 }
}
