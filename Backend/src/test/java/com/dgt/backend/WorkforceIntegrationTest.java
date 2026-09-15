package com.dgt.backend;
import java.util.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import tools.jackson.databind.*;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
 "app.workforce.enabled=true","app.workforce.shift-changes.enabled=true","app.workweek.enabled=true","app.billing.enabled=true","app.profile.enabled=true","spring.datasource.url=jdbc:postgresql://127.0.0.1:55439/dgt_test","spring.datasource.username=dgt_test","spring.datasource.password=only-test-password","logging.level.root=WARN","debug=false"})
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class WorkforceIntegrationTest {
 @Value("${local.server.port}") int port;
 @Autowired com.dgt.backend.billing.service.StoreBilling billing;
 @Autowired JdbcTemplate db;@Autowired ObjectMapper json;
 HttpClient http=HttpClient.newHttpClient();String tag=UUID.randomUUID().toString().substring(0,8),store,second,foreign;
 long company,otherCompany;Map<String,Long> users=new HashMap<>();Map<String,Long> assignments=new HashMap<>();
 String password="Only-local-integration-tests";long departmentModule,settingsModule;String customId;
 record Response(int code,JsonNode body){}
 Response call(String who,String method,String path,Object body,String version,String key) throws Exception {
  var b=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path));
  if(who!=null)b.header("Authorization","Basic "+Base64.getEncoder().encodeToString((who+"-"+tag+"@example.test:"+password).getBytes(StandardCharsets.UTF_8)));
  if(version!=null)b.header("If-Match",version);
  b.header("Idempotency-Key",key==null?UUID.randomUUID().toString():key);
  if(body!=null)b.header("Content-Type","application/json").method(method,HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));else b.method(method,HttpRequest.BodyPublishers.noBody());
  var r=http.send(b.build(),HttpResponse.BodyHandlers.ofString());return new Response(r.statusCode(),r.body().isBlank()?json.createObjectNode():json.readTree(r.body()));
 }
 Response req(String who,String method,String path,Object body) throws Exception{return call(who,method,path,body,null,null);}
 JsonNode ok(Response r,int code){assertThat(r.code()).as(r.body().toString()).isEqualTo(code);return r.body();}
 String dept(String s){return "/stores/"+s+"/department-access";}String settings(){return "/stores/"+store+"/settings";}String access(){return "/access/stores/"+store;}
 String addStore(long c){String unique=UUID.randomUUID().toString();return db.queryForObject("INSERT INTO stores(store_id,store_name,legal_business_name,tax_id,license_number,company_id,timezone) VALUES (?,?,?,?,?,?,?) RETURNING dgt_id",String.class,unique,"Test "+unique,"Legal "+unique,"Tax "+unique,"Lic "+unique,c,"Asia/Kolkata");}
 @BeforeAll void fixtures(){
  assertThat(db.queryForObject("SELECT current_database()",String.class)).isEqualTo("dgt_test");
  company=db.queryForObject("INSERT INTO companies(company_name) VALUES (?) RETURNING company_id",Long.class,"Access test "+tag);otherCompany=db.queryForObject("INSERT INTO companies(company_name) VALUES (?) RETURNING company_id",Long.class,"Other test "+tag);
  store=addStore(company);second=addStore(company);foreign=addStore(otherCompany);
  settingsModule=db.queryForObject("SELECT module_id FROM modules WHERE module_name='STORE_SETTINGS'",Long.class);departmentModule=db.queryForObject("SELECT module_id FROM modules WHERE module_name='DEPARTMENTS'",Long.class);
  String hash=new BCryptPasswordEncoder(4).encode(password);
  for(String role:List.of("admin","manager","cashier","accountant","other")){
   long id=db.queryForObject("INSERT INTO users(dgt_id,employee_id,first_name,last_name,email,password_hash) VALUES (?,?,?,?,?,?) RETURNING user_id",Long.class,role.equals("other")?foreign:store,tag+role,role,"Test",role+"-"+tag+"@example.test",hash);users.put(role,id);
   if(role.equals("admin")||role.equals("other"))db.update("INSERT INTO company_admins(company_id,user_id) VALUES (?,?)",role.equals("admin")?company:otherCompany,id);
   else{long roleType=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name=?",Long.class,role.toUpperCase());long ar=db.queryForObject("INSERT INTO user_roles(user_id,role_type_id,dgt_id) VALUES (?,?,?) RETURNING user_role_id",Long.class,id,roleType,store);assignments.put(role,ar);for(String code:List.of("STORE_SETTINGS_VIEW","STORE_SETTINGS_EDIT","DEPARTMENTS_VIEW","DEPARTMENTS_EDIT"))db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) VALUES (?,?,?,?)",store,roleType,code,!role.equals("accountant")||code.endsWith("_VIEW"));for(long module:List.of(settingsModule,departmentModule))db.update("INSERT INTO permissions(user_role_id,module_id,can_view,can_edit) VALUES (?,?,true,?)",ar,module,!role.equals("accountant"));}
  }
 }
 @AfterAll void cleanup(){
  if(company==0)return;
  db.update("DELETE FROM workforce_leave_shifts WHERE request_id IN (SELECT request_id FROM workforce_requests WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM workforce_availability WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM workforce_requests WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM employee_time_off_requests WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM employee_schedules WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM employee_compensation WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id IN (SELECT user_id FROM users WHERE dgt_id IN (?,?,?)))",store,second,foreign);
  db.update("DELETE FROM employee_store_assignments WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM employees WHERE user_id IN (SELECT user_id FROM users WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM billing_change_requests WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM billing_invoices WHERE store_id IN (SELECT store_id FROM stores WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM store_subscriptions WHERE store_id IN (SELECT store_id FROM stores WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM user_login_events WHERE user_id IN (SELECT user_id FROM users WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM user_sessions WHERE user_id IN (SELECT user_id FROM users WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM store_role_permissions WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM approval_requests WHERE company_id IN (?,?)",company,otherCompany);db.update("DELETE FROM access_audit_events WHERE company_id IN (?,?)",company,otherCompany);db.update("DELETE FROM module_approval_policies WHERE company_id IN (?,?)",company,otherCompany);
  db.update("DELETE FROM permissions WHERE user_role_id IN (SELECT user_role_id FROM user_roles WHERE dgt_id IN (?,?,?))",store,second,foreign);db.update("DELETE FROM user_roles WHERE dgt_id IN (?,?,?)",store,second,foreign);db.update("DELETE FROM company_admins WHERE company_id IN (?,?)",company,otherCompany);db.update("DELETE FROM users WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM store_contact_info WHERE dgt_id IN (?,?,?)",store,second,foreign);db.update("DELETE FROM store_business_hours WHERE dgt_id IN (?,?,?)",store,second,foreign);db.update("DELETE FROM store_departments WHERE dgt_id IN (?,?,?)",store,second,foreign);db.update("DELETE FROM stores WHERE dgt_id IN (?,?,?)",store,second,foreign);db.update("DELETE FROM companies WHERE company_id IN (?,?)",company,otherCompany);
 }
 long staff,replacement,boss,adminEmployee; String day="2027-06-05"; long night;
 String wf(){return access()+"/workforce";}
 Map<String,Object> shiftBody(long employee,String start,String end){return new HashMap<>(Map.of("employeeId",employee,"start",start,"end",end,"status","PUBLISHED"));}
 long shiftAs(String who,long employee,String start,String end)throws Exception{return ok(req(who,"POST",wf()+"/shifts",shiftBody(employee,start,end)),200).path("id").asLong();}
 long employee(String role)throws Exception{
  long rt=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name=?",Long.class,role.toUpperCase());
  ok(req("admin","POST",access()+"/employees",Map.of("userId",users.get(role),"roleTypeId",rt,"hireDate","2026-01-01","employeeType","Full-time","payType","Hourly","rate",18,"status","Active")),200);
  return db.queryForObject("SELECT employee_id FROM employees WHERE user_id=?",Long.class,users.get(role));
 }
 Map<String,Object> leave(long employee,String date){return new HashMap<>(Map.of("kind","TIME_OFF","employeeId",employee,"startDate",date,"endDate",date,"leaveType","Personal Day","reason","Private reason"));}
 long ask(String who,Map<String,Object> body)throws Exception{return ok(req(who,"POST",wf()+"/requests",body),200).path("id").asLong();}
 String version(long id){return db.queryForObject("SELECT xmin::text FROM workforce_requests WHERE request_id=?",String.class,id);}
 Response decide(String who,long id,String action)throws Exception{return req(who,"POST",wf()+"/requests/"+id+"/decision",Map.of("action",action,"version",version(id),"note","Confirmed with employee"));}
 @Test @Order(1) void schedulePermissionsIsolationAndOvernight()throws Exception{
  staff=employee("cashier");replacement=employee("accountant");boss=employee("manager");
  ok(req("other","GET",wf(),null),403);
  ok(req("cashier","POST",wf()+"/shifts",shiftBody(staff,day+"T22:00","2027-06-06T06:00")),403);
  night=shiftAs("manager",staff,day+"T22:00","2027-06-06T06:00");
  var data=ok(req("cashier","GET",wf()+"?week=2027-05-31",null),200);
  assertThat(data.path("shifts").get(0).path("hours").asDouble()).isEqualTo(8);
  assertThat(data.toString()).doesNotContain("password_hash","bank_name","rate","Private");
  ok(req("manager","POST",wf()+"/shifts",shiftBody(staff,"2027-06-06T01:00","2027-06-06T08:00")),409);
  long rt=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER'",Long.class);
  db.update("INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id) VALUES (?,?,false,'2026-01-01',?)",staff,second,rt);
  ok(req("admin","POST","/access/stores/"+second+"/workforce/shifts",shiftBody(staff,day+"T23:00","2027-06-06T07:00")),409);
 }
 @Test @Order(2) void leaveCountsWeekendAndRequiresReview()throws Exception{
  ok(req("cashier","POST",wf()+"/requests",leave(replacement,day)),403);
  var body=leave(staff,day);String key=UUID.randomUUID().toString();long id=ok(call("cashier","POST",wf()+"/requests",body,null,key),200).path("id").asLong();
  assertThat(ok(call("cashier","POST",wf()+"/requests",body,null,key),200).path("id").asLong()).isEqualTo(id);
  ok(decide("cashier",id,"APPROVE"),403);ok(decide("other",id,"APPROVE"),403);ok(decide("manager",id,"APPROVE"),200);ok(decide("manager",id,"APPROVE"),409);
  assertThat(db.queryForObject("SELECT status FROM employee_schedules WHERE schedule_id=?",String.class,night)).isEqualTo("NEEDS_COVERAGE");
  var row=ok(req("cashier","GET",wf(),null),200).path("requests").get(0);assertThat(row.path("days").asInt()).isEqualTo(1);assertThat(row.path("hours").asDouble()).isEqualTo(8);
  ok(req("manager","POST",wf()+"/shifts",shiftBody(staff,day+"T12:00",day+"T14:00")),409);
  long unscheduled=ask("cashier",leave(staff,"2027-06-20"));ok(decide("manager",unscheduled,"APPROVE"),200);
  assertThat(ok(req("cashier","GET",wf(),null),200).path("requests").get(0).path("hours").isNull()).isTrue();
  long senior=ask("manager",leave(boss,"2027-06-20"));ok(decide("manager",senior,"APPROVE"),403);ok(decide("admin",senior,"APPROVE"),200);
 }
 @Test @Order(3) void coverageNeedsConsentThenMovesShift()throws Exception{
  long id=ask("cashier",new HashMap<>(Map.of("kind","COVER","employeeId",staff,"shiftId",night,"targetEmployeeId",replacement,"reason","Private reason")));
  ok(decide("manager",id,"APPROVE"),400);
  assertThat(ok(req("accountant","GET",wf(),null),200).toString()).doesNotContain("Private reason");
  ok(decide("accountant",id,"ACCEPT"),200);ok(decide("accountant",id,"APPROVE"),403);ok(decide("manager",id,"APPROVE"),200);
  assertThat(db.queryForObject("SELECT employee_id FROM employee_schedules WHERE schedule_id=?",Long.class,night)).isEqualTo(replacement);
 }
 @Test @Order(4) void availabilityApprovalOverridesAndExceptions()throws Exception{
  var body=new HashMap<String,Object>(Map.of("kind","AVAILABILITY","employeeId",staff,"startDate","2027-07-01","endDate","2027-07-01","weekday",1,"startTime","09:00","endTime","17:00"));
  long id=ask("cashier",body);ok(decide("manager",id,"APPROVE"),200);
  var input=shiftBody(staff,"2027-07-05T18:00","2027-07-05T22:00");ok(req("manager","POST",wf()+"/shifts",input),409);input.put("overrideReason","Employee confirmed exception");ok(req("manager","POST",wf()+"/shifts",input),200);
  body=new HashMap<>(Map.of("kind","EXCEPTION","employeeId",staff,"startDate","2027-07-06","endDate","2027-07-06","unavailable",true));id=ask("cashier",body);ok(decide("manager",id,"APPROVE"),200);
  ok(req("manager","POST",wf()+"/shifts",shiftBody(staff,"2027-07-06T09:00","2027-07-06T17:00")),409);
  assertThat(ok(req("manager","GET",wf()+"?week=2027-07-05",null),200).path("shifts").size()).isEqualTo(1);
 }
 @Test @Order(5) void swapIsAtomicDeclineAndStaleRequest()throws Exception{
  long a=shiftAs("manager",staff,"2027-08-02T09:00","2027-08-02T17:00"),b=shiftAs("manager",replacement,"2027-08-03T09:00","2027-08-03T17:00");
  var body=new HashMap<String,Object>(Map.of("kind","SWAP","employeeId",staff,"shiftId",a,"otherShiftId",b));long id=ask("cashier",body);
  ok(decide("accountant",id,"DECLINE"),200);assertThat(db.queryForObject("SELECT employee_id FROM employee_schedules WHERE schedule_id=?",Long.class,a)).isEqualTo(staff);
  id=ask("cashier",body);ok(decide("accountant",id,"ACCEPT"),200);ok(decide("manager",id,"APPROVE"),200);
  assertThat(db.queryForObject("SELECT employee_id FROM employee_schedules WHERE schedule_id=?",Long.class,a)).isEqualTo(replacement);assertThat(db.queryForObject("SELECT employee_id FROM employee_schedules WHERE schedule_id=?",Long.class,b)).isEqualTo(staff);
  id=ask("cashier",new HashMap<>(Map.of("kind","COVER","employeeId",staff,"shiftId",b,"targetEmployeeId",replacement)));
  db.update("UPDATE employee_schedules SET notes='Changed' WHERE schedule_id=?",b);ok(decide("accountant",id,"ACCEPT"),409);ok(decide("cashier",id,"CANCEL"),200);
 }
 @Test @Order(6) void draftsCopyPublishAndDstValidation()throws Exception{
  var body=shiftBody(replacement,"2027-09-01T09:00","2027-09-01T17:00");body.put("status","DRAFT");long id=ok(req("manager","POST",wf()+"/shifts",body),200).path("id").asLong();
  assertThat(ok(req("cashier","GET",wf()+"?week=2027-08-30",null),200).path("shifts").size()).isZero();
  ok(req("manager","POST",wf()+"/week",Map.of("week","2027-08-30","action","PUBLISH")),200);
  ok(req("manager","POST",wf()+"/week",Map.of("week","2027-08-30","action","COPY")),200);
  ok(req("manager","POST",wf()+"/week",Map.of("week","2027-08-30","action","COPY")),409);
  String version=db.queryForObject("SELECT xmin::text FROM employee_schedules WHERE schedule_id=?",String.class,id);ok(req("manager","POST",wf()+"/shifts/"+id+"/cancel",Map.of("version",version)),200);
  db.update("UPDATE stores SET timezone='America/New_York' WHERE dgt_id=?",store);
  ok(req("manager","POST",wf()+"/shifts",shiftBody(replacement,"2027-03-14T02:30","2027-03-14T05:00")),400);
  body=shiftBody(replacement,"2027-11-07T01:30","2027-11-07T02:30");ok(req("manager","POST",wf()+"/shifts",body),400);body.put("startOffset","-04:00");body.put("endOffset","-05:00");ok(req("manager","POST",wf()+"/shifts",body),200);
  assertThat(ok(req("manager","GET",wf()+"?week=2027-11-01",null),200).path("shifts").get(0).path("hours").asDouble()).isEqualTo(2);
 }

 @Test @Order(7) void specificShiftLeaveDoesNotBlockSeparateShiftAndRejectsInjectedReferences()throws Exception{
  long a=shiftAs("manager",staff,"2027-12-04T09:00","2027-12-04T12:00");
  var body=leave(staff,"2027-12-04");body.put("shiftId",a);long id=ask("cashier",body);ok(decide("manager",id,"APPROVE"),200);
  shiftAs("manager",staff,"2027-12-04T16:00","2027-12-04T20:00");
  var malicious=new HashMap<String,Object>(Map.of("kind","EXCEPTION","employeeId",staff,"startDate","2027-12-05","endDate","2027-12-05","unavailable",true,"shiftId",a));ok(req("cashier","POST",wf()+"/requests",malicious),400);
  body=leave(staff,"2027-12-06");body.put("targetEmployeeId",boss);ok(req("cashier","POST",wf()+"/requests",body),400);
 }

 @Test @Order(8) void adminAutoApprovalAndEmployeeReviewButton()throws Exception{
  adminEmployee=db.queryForObject("INSERT INTO employees(user_id,hire_date,employee_type) VALUES (?,'2026-01-01','Full-time') RETURNING employee_id",Long.class,users.get("admin"));db.update("INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id) VALUES (?,?,true,'2026-01-01',(SELECT role_type_id FROM role_types WHERE role_type_name='ADMIN'))",adminEmployee,store);long id=ask("admin",leave(adminEmployee,"2028-01-08"));assertThat(db.queryForObject("SELECT status FROM workforce_requests WHERE request_id=?",String.class,id)).isEqualTo("APPROVED");
  assertThat(db.queryForObject("SELECT reviewed_by FROM workforce_requests WHERE request_id=?",Long.class,id)).isEqualTo(users.get("admin"));
  long exception=ask("admin",new HashMap<>(Map.of("kind","EXCEPTION","employeeId",adminEmployee,"startDate","2028-01-09","endDate","2028-01-09","unavailable",true)));
  assertThat(db.queryForObject("SELECT count(*) FROM workforce_availability WHERE request_id=?",Integer.class,exception)).isEqualTo(1);
  long enteredByAdmin=ask("admin",leave(staff,"2028-01-12"));assertThat(db.queryForObject("SELECT status FROM workforce_requests WHERE request_id=?",String.class,enteredByAdmin)).isEqualTo("PENDING");ok(decide("admin",enteredByAdmin,"APPROVE"),200);
  long pending=ask("cashier",leave(staff,"2028-01-10"));JsonNode row=null;for(var r:ok(req("admin","GET",wf(),null),200).path("requests"))if(r.path("request_id").asLong()==pending)row=r;assertThat(row.path("can_review").asBoolean()).isTrue();
  ok(decide("cashier",pending,"APPROVE"),403);ok(decide("manager",pending,"APPROVE"),200);
  long legacy=ask("manager",leave(boss,"2028-01-11"));db.update("UPDATE workforce_requests SET submitted_by=? WHERE request_id=?",users.get("admin"),legacy);ok(decide("admin",legacy,"APPROVE"),200);
 }
 @Test @Order(9) void adminSwapWaitsForConsentThenAutoApproves()throws Exception{
  long first=shiftAs("manager",adminEmployee,"2028-02-05T09:00","2028-02-05T12:00"),secondShift=shiftAs("manager",replacement,"2028-02-06T09:00","2028-02-06T12:00");
  long id=ask("admin",new HashMap<>(Map.of("kind","SWAP","employeeId",adminEmployee,"shiftId",first,"otherShiftId",secondShift)));
  assertThat(db.queryForObject("SELECT status FROM workforce_requests WHERE request_id=?",String.class,id)).isEqualTo("PENDING");ok(decide("admin",id,"APPROVE"),400);
  ok(decide("accountant",id,"ACCEPT"),200);
  assertThat(db.queryForObject("SELECT status FROM workforce_requests WHERE request_id=?",String.class,id)).isEqualTo("APPROVED");assertThat(db.queryForObject("SELECT reviewed_by FROM workforce_requests WHERE request_id=?",Long.class,id)).isEqualTo(users.get("admin"));
  assertThat(db.queryForObject("SELECT employee_id FROM employee_schedules WHERE schedule_id=?",Long.class,first)).isEqualTo(replacement);assertThat(db.queryForObject("SELECT employee_id FROM employee_schedules WHERE schedule_id=?",Long.class,secondShift)).isEqualTo(adminEmployee);
 }

 @Autowired com.dgt.backend.workforce.WorkforceService workforce;
 @Test @Order(10) void pausedShiftChangesRejectMutationsButAllowCancellation()throws Exception{
  long shift=shiftAs("manager",staff,"2028-03-04T09:00","2028-03-04T12:00");var body=new HashMap<String,Object>(Map.of("kind","COVER","employeeId",staff,"shiftId",shift,"targetEmployeeId",replacement));long id=ask("cashier",body);
  org.springframework.test.util.ReflectionTestUtils.setField(workforce,"shiftChangesEnabled",false);
  try{ok(req("cashier","POST",wf()+"/requests",body),400);ok(decide("accountant",id,"ACCEPT"),400);ok(decide("admin",id,"APPROVE"),400);ok(decide("cashier",id,"CANCEL"),200);}finally{org.springframework.test.util.ReflectionTestUtils.setField(workforce,"shiftChangesEnabled",true);}
 }
}
