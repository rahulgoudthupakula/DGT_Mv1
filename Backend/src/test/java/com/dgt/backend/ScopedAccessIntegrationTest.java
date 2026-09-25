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
 "app.workforce.enabled=true","app.tender.fleet.enabled=true","app.tender.ebt.enabled=true","app.tender.credit-card.enabled=true","app.daily-closing.enabled=true","app.sales.activity.enabled=true","app.gas.tank-report.enabled=true","app.gas.adjustments.enabled=true","app.gas.price.enabled=true","app.gas.delivery.enabled=true","app.gas.settings.enabled=true","app.pricebook.enabled=true","app.workweek.enabled=true","app.billing.enabled=true","app.profile.enabled=true","spring.datasource.url=jdbc:postgresql://127.0.0.1:55439/dgt_test","spring.datasource.username=${DGT_TEST_RUNTIME_USER:dgt_test}","spring.datasource.password=${DGT_TEST_RUNTIME_PASSWORD:only-test-password}","logging.level.root=WARN","debug=false"})
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ScopedAccessIntegrationTest {
 @Value("${local.server.port}") int port;
 @Autowired com.dgt.backend.billing.service.StoreBilling billing;
 @Autowired JdbcTemplate runtimeDb;
 JdbcTemplate db=new JdbcTemplate(new org.springframework.jdbc.datasource.DriverManagerDataSource("jdbc:postgresql://127.0.0.1:55439/dgt_test","dgt_test","only-test-password"));@Autowired ObjectMapper json;
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
  // Legacy workflow tests explicitly enable their parent modules.
  for(var section:com.dgt.backend.access.PagePermissions.SECTIONS)if(!section.defaultAllowed())
   db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) SELECT ?,role_type_id,?,true FROM role_types WHERE role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT')",store,section.code());
 }
 @AfterAll void cleanup(){
  if(company==0)return;
  db.update("DELETE FROM store_creation_requests WHERE company_id IN (?,?)",company,otherCompany);
  for(String child:db.queryForList("SELECT dgt_id FROM stores WHERE company_id IN (?,?) AND parent_store_dgt_id IS NOT NULL ORDER BY dgt_id DESC",String.class,company,otherCompany)){
   db.update("DELETE FROM access_audit_events WHERE dgt_id=?",child);
   db.update("DELETE FROM user_roles WHERE dgt_id=?",child);
   db.update("DELETE FROM store_role_permissions WHERE dgt_id=?",child);
   db.update("DELETE FROM store_contact_info WHERE dgt_id=?",child);
   db.update("DELETE FROM store_business_hours WHERE dgt_id=?",child);
   db.update("DELETE FROM stores WHERE dgt_id=?",child);
  }
  db.update("DELETE FROM user_store_permission_overrides WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM lottery_sales_links WHERE lottery_pack_inventory_id IN (SELECT lottery_pack_inventory_id FROM lottery_pack_inventory WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM lottery_pack_inventory_items WHERE lottery_pack_inventory_id IN (SELECT lottery_pack_inventory_id FROM lottery_pack_inventory WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM lottery_pack_inventory WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM lottery_packs WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM lottery_games WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM rebate_claim_payments WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM rebate_claims WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM rebate_program_items WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM rebate_programs WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM sale_discount_applications WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM store_discounts WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM fleet_batch_payments WHERE batch_id IN (SELECT batch_id FROM fleet_batches WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM fleet_batches WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM ebt_batch_payments WHERE batch_id IN (SELECT batch_id FROM ebt_batches WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM ebt_batches WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM credit_card_batch_payments WHERE batch_id IN (SELECT batch_id FROM credit_card_batches WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM credit_card_batches WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM credit_card_processors WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM credit_card_settings WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM daily_closing_deposits WHERE everyday_closing_id IN (SELECT everyday_closing_id FROM everyday_closing WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM daily_expenses WHERE everyday_closing_id IN (SELECT everyday_closing_id FROM everyday_closing WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM daily_closing_tenders WHERE everyday_closing_id IN (SELECT everyday_closing_id FROM everyday_closing WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM everyday_closing WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM sales WHERE store_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM pos_terminals WHERE store_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM inventory_movements WHERE dgt_id IN (?,?,?) AND (fuel_delivery_line_id IS NOT NULL OR fuel_adjustment_line_id IS NOT NULL)",store,second,foreign);
  db.update("DELETE FROM fuel_adjustment_lines WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM fuel_adjustments WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM fuel_delivery_lines WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM fuel_deliveries WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM fuel_prices WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM gas_settings WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM fuel_tank_readings WHERE tank_id IN (SELECT tank_id FROM fuel_tanks WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM fuel_tank_grade_assignments WHERE tank_id IN (SELECT tank_id FROM fuel_tanks WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM fuel_tanks WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM fuel_grades WHERE grade_name=?", "GAS TEST "+tag);
  db.update("DELETE FROM grocery_settings WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("UPDATE invoices SET purchase_order_id=NULL WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM purchase_order_lines WHERE purchase_order_id IN (SELECT purchase_order_id FROM purchase_orders WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM purchase_orders WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM inventory_return_items WHERE return_id IN (SELECT return_id FROM inventory_returns WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM inventory_returns WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM inventory_transfer_items WHERE transfer_id IN (SELECT transfer_id FROM inventory_transfers WHERE from_dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM inventory_transfers WHERE from_dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM inventory_shrinkage_items WHERE shrinkage_id IN (SELECT shrinkage_id FROM inventory_shrinkage WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM inventory_shrinkage WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM inventory_reduction_requests WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM product_price_groups WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM price_groups WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM promotion_products WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM promotions WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM vendor_audit_log WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM vendor_item_cost_history WHERE product_id IN (SELECT product_id FROM products WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM vendor_price_settings WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM invoice_charges WHERE invoice_id IN (SELECT invoice_id FROM invoices WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM grocery_invoice_items WHERE invoice_id IN (SELECT invoice_id FROM invoices WHERE dgt_id IN (?,?,?))",store,second,foreign);
  db.update("DELETE FROM invoices WHERE dgt_id IN (?,?,?)",store,second,foreign);
  for(String table:List.of("inventory_movements","product_barcodes","product_store_prices","inventory","product_vendors","products","vendor_contacts","vendors","store_sub_departments"))db.update("DELETE FROM "+table+" WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM employee_compensation WHERE employee_id IN (SELECT employee_id FROM employees WHERE user_id IN (SELECT user_id FROM users WHERE dgt_id IN (?,?,?)))",store,second,foreign);
  db.update("DELETE FROM employee_store_assignments WHERE dgt_id IN (?,?,?)",store,second,foreign);
  db.update("DELETE FROM employees WHERE first_name=? AND last_name='Discount fixture'",tag);
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
 @Test @Order(1) void isolationAndLegacyBypassClosed() throws Exception{
  var list=ok(req("admin","GET","/access/stores",null),200);assertThat(list.size()).isEqualTo(2);assertThat(list.toString()).doesNotContain(foreign);
  assertThat(ok(req("manager","GET","/access/stores",null),200).size()).isEqualTo(1);
  ok(req("other","GET",settings(),null),403);ok(req("cashier","GET",dept(second),null),403);
  for(String path:List.of("/stores","/users","/permissions","/reports/inventory","/store-departments","/store-contact-info"))ok(req("admin","GET",path,null),403);
  ok(req("cashier","PATCH","/store-departments/1",Map.of("is_active",false)),403);
  ok(req(null,"GET","/access/me",null),401);ok(req("cashier","GET",access()+"/permissions",null),403);
 }
 @Test @Order(2) void cashierQueuesAndManagerApprovesOnce() throws Exception{
  String name="Pending "+tag,key=UUID.randomUUID().toString();var r=ok(call("cashier","POST",dept(store),Map.of("name",name),null,key),201);assertThat(r.path("pending").asBoolean()).isTrue();long id=r.path("requestId").asLong();
  assertThat(ok(req("admin","GET",dept(store),null),200).toString()).doesNotContain(name);
  assertThat(ok(call("cashier","POST",dept(store),Map.of("name",name),null,key),201).path("requestId").asLong()).isEqualTo(id);
  ok(req("cashier","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")),403);
  ok(req("other","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")),403);
  ok(req("manager","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")),200);
  ok(req("manager","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")),409);
  for(var d:ok(req("admin","GET",dept(store),null),200))if(d.path("name").asText().equals(name))customId=d.path("id").asText();assertThat(customId).isNotNull();
  assertThat(db.queryForObject("SELECT count(*) FROM store_departments WHERE dgt_id=? AND store_department_name=?",Long.class,store,name)).isEqualTo(1);
 }
 void permission(String role,long module,boolean view,boolean edit) throws Exception{
  long rt=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name=?",Long.class,role.toUpperCase());
  String name=module==settingsModule?"STORE_SETTINGS":"DEPARTMENTS";
  for(String suffix:List.of("_VIEW","_EDIT")){
   String code=name+suffix;var versions=db.queryForList("SELECT xmin::text FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code=?",String.class,store,rt,code);
   ok(req("admin","PUT",access()+"/role-permissions",Map.of("roleTypeId",rt,"code",code,"allowed",suffix.equals("_VIEW")?view:edit,"version",versions.isEmpty()?"0":versions.getFirst())),200);
  }
 }
 @Test @Order(3) void accountantReadOnlyAndRevokedPendingChangeCannotApply() throws Exception{
  ok(req("accountant","POST",dept(store),Map.of("name","Acct "+tag)),403);
  permission("accountant",departmentModule,true,true);
  long id=ok(req("accountant","POST",dept(store),Map.of("name","Acct "+tag)),201).path("requestId").asLong();assertThat(id).isPositive();
  permission("accountant",departmentModule,true,false);
  ok(req("admin","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")),403);
  assertThat(db.queryForObject("SELECT count(*) FROM store_departments WHERE dgt_id=? AND store_department_name=?",Long.class,store,"Acct "+tag)).isZero();
  ok(req("accountant","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","CANCELLED")),200);
 }
 @Test @Order(4) void managerPolicyRequiresAdminAndRejectsOwnApproval() throws Exception{
  ok(req("admin","PUT",access()+"/approval-policy",Map.of("moduleId",departmentModule,"required",true,"version","0")),200);
  long id=ok(req("manager","POST",dept(store),Map.of("name","Manager "+tag)),201).path("requestId").asLong();assertThat(id).isPositive();
  ok(req("manager","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")),403);
  ok(req("admin","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")),200);
 }
 @Test @Order(5) void settingsQueueAndStaleApprovalRollback() throws Exception{
  var before=ok(req("cashier","GET",settings(),null),200);String version=before.path("store").path("_version").asText();
  var body=Map.of("store",Map.of("store_name","Queued name "+tag));long id=ok(call("cashier","PATCH",settings(),body,version,null),200).path("requestId").asLong();
  assertThat(ok(req("admin","GET",settings(),null),200).path("store").path("store_name").asText()).doesNotContain("Queued");
  ok(call("admin","PATCH",settings(),Map.of("store",Map.of("store_name","Newer name "+tag)),version,null),200);
  ok(req("admin","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")),409);
  assertThat(ok(req("admin","GET",settings(),null),200).path("store").path("store_name").asText()).isEqualTo("Newer name "+tag);
  ok(req("admin","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","REJECTED","note","Stale version")),200);
 }
 @Test @Order(6) void protectedOwnershipAndInvalidRequestsDontQueue() throws Exception{
  String v=ok(req("cashier","GET",settings(),null),200).path("store").path("_version").asText();
  ok(call("cashier","PATCH",settings(),Map.of("store",Map.of("company_id",otherCompany)),v,null),400);
  ok(req("cashier","POST",dept(store),Map.of("name","   ")),400);
  ok(req("admin","DELETE",dept(store)+"/"+customId,null),405);
  ok(req("cashier","PUT",access()+"/permissions",Map.of("roleId",assignments.get("cashier"),"moduleId",departmentModule,"view",true,"edit",true,"version","0")),403);
 }
 @Test @Order(7) void roleAssignmentStoreIsolationAndDeactivation() throws Exception{
  long rt=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  ok(req("admin","PUT","/access/stores/"+second+"/roles",Map.of("userId",users.get("manager"),"roleTypeId",rt,"active",true,"version","0")),200);
  assertThat(ok(req("manager","GET","/access/stores",null),200).size()).isEqualTo(2);
  ok(req("manager","GET",dept(second),null),403);
  ok(req("admin","PUT",access()+"/roles",Map.of("userId",users.get("other"),"roleTypeId",rt,"active",true,"version","0")),403);
  String v=db.queryForObject("SELECT xmin::text FROM user_roles WHERE user_role_id=?",String.class,assignments.get("cashier"));long cr=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER'",Long.class);
  ok(req("admin","PUT",access()+"/roles",Map.of("userId",users.get("cashier"),"roleTypeId",cr,"active",false,"version",v)),200);
  ok(req("cashier","GET",dept(store),null),403);assertThat(ok(req("cashier","GET","/access/stores",null),200).size()).isZero();
 }

 @Test @Order(8) void parallelApprovalAppliesOnlyOnce() throws Exception {
  String name="Parallel "+tag;
  long id=ok(req("manager","POST",dept(store),Map.of("name",name)),201).path("requestId").asLong();
  var first=java.util.concurrent.CompletableFuture.supplyAsync(()->{try{return req("admin","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")).code();}catch(Exception e){throw new RuntimeException(e);}});
  var second=java.util.concurrent.CompletableFuture.supplyAsync(()->{try{return req("admin","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")).code();}catch(Exception e){throw new RuntimeException(e);}});
  assertThat(List.of(first.get(),second.get())).containsExactlyInAnyOrder(200,409);
  assertThat(db.queryForObject("SELECT count(*) FROM store_departments WHERE dgt_id=? AND store_department_name=?",Long.class,store,name)).isEqualTo(1);
 }
 @Test @Order(9) void approvedSettingsPersistAndInvalidHoursRollback() throws Exception {
  permission("accountant",settingsModule,true,true);
  var before=ok(req("accountant","GET",settings(),null),200);String v=before.path("store").path("_version").asText();
  var body=Map.of("store",Map.of("timezone","Asia/Tokyo"),"contact",Map.of("address","Test address","email","test@example.com"));
  long id=ok(call("accountant","PATCH",settings(),body,v,null),200).path("requestId").asLong();
  assertThat(ok(req("admin","GET",settings(),null),200).path("contact").isNull()).isTrue();
  ok(req("manager","POST",access()+"/approvals/"+id+"/decision",Map.of("decision","APPROVED")),200);
  var after=ok(req("admin","GET",settings(),null),200);assertThat(after.path("contact").path("email").asText()).isEqualTo("test@example.com");assertThat(after.path("store").path("timezone").asText()).isEqualTo("Asia/Tokyo");
  ok(call("admin","PATCH",settings(),Map.of("store",Map.of("timezone","Invalid/Zone"),"contact",Map.of("address","Must roll back"),"contactVersion",after.path("contact").path("_version").asText()),after.path("store").path("_version").asText(),null),400);
  assertThat(ok(req("admin","GET",settings(),null),200).path("contact").path("address").asText()).isEqualTo("Test address");
 }

 @Test @Order(10) void scopedBusinessDayPreservesTimezoneBoundaries() throws Exception {
  var before=ok(req("admin","GET",settings(),null),200);
  ok(call("admin","PATCH",settings(),Map.of("store",Map.of("timezone","America/New_York")),before.path("store").path("_version").asText(),null),200);
  var day=ok(req("admin","GET","/stores/"+store+"/business-day?date=2026-03-08",null),200);
  var start=java.time.Instant.parse(day.path("startInclusive").asText());var end=java.time.Instant.parse(day.path("endExclusive").asText());assertThat(java.time.Duration.between(start,end).toHours()).isEqualTo(23);
  ok(req("other","GET","/stores/"+store+"/business-day?date=2026-03-08",null),403);
 }
 @Test @Order(11) void auditAndSchema() {
  assertThat(db.queryForObject("SELECT count(*) FROM access_audit_events WHERE company_id=?",Long.class,company)).isGreaterThan(5);
  assertThat(db.queryForObject("SELECT coalesce(string_agg(changes::text,''),'') FROM access_audit_events WHERE company_id=?",String.class,company)).doesNotContain(password,"password_hash");
 }
 @Test @Order(12) void adminCreatesUserAndPermissionsAtomically() throws Exception {
  permission("manager",settingsModule,true,false);permission("manager",departmentModule,false,false);
  long rt=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  var body=new HashMap<String,Object>(Map.of("firstName","New","lastName","Manager","employeeId","new-"+tag,"email","new-"+tag+"@example.test","password",password,"roleTypeId",rt,"stores",List.of(store,second),"modules",List.of(Map.of("moduleId",settingsModule,"view",true,"edit",false))));
  body.remove("modules");
  ok(req("manager","POST",access()+"/users",body),403);
  body.put("stores",List.of(store,foreign));ok(req("admin","POST",access()+"/users",body),403);
  assertThat(db.queryForObject("SELECT count(*) FROM users WHERE email=?",Long.class,body.get("email"))).isZero();
  body.put("stores",List.of(store,second));
  var created=ok(req("admin","POST",access()+"/users",body),201);assertThat(created.toString()).doesNotContain(password,"password_hash");
  String hash=db.queryForObject("SELECT password_hash FROM users WHERE user_id=?",String.class,created.path("userId").asLong());assertThat(new BCryptPasswordEncoder().matches(password,hash)).isTrue();
  assertThat(ok(req("new","GET","/access/stores",null),200).size()).isEqualTo(2);
  ok(req("new","GET",settings(),null),200);ok(req("new","GET",dept(store),null),403);
  permission("manager",departmentModule,true,false);
  ok(req("new","GET",dept(store),null),200);ok(req("manager","GET",dept(store),null),200);
  ok(req("new","GET",dept(second),null),403);
  permission("manager",departmentModule,false,false);ok(req("new","GET",dept(store),null),403);
  String v=ok(req("new","GET",settings(),null),200).path("store").path("_version").asText();
  ok(call("new","PATCH",settings(),Map.of("store",Map.of("store_name","Forbidden")),v,null),403);
  ok(req("admin","POST",access()+"/users",body),409);
  body.put("email","NEW-"+tag+"@example.test");ok(req("admin","POST",access()+"/users",body),409);
  assertThat(db.queryForObject("SELECT coalesce(string_agg(changes::text,''),'') FROM access_audit_events WHERE company_id=?",String.class,company)).doesNotContain(password,hash);
 }
 @Test @Order(13) void creationRejectsInvalidRolesGrantsAndPasswords() throws Exception {
  long rt=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='ACCOUNTANT'",Long.class);
  var body=new HashMap<String,Object>(Map.of("firstName","New","lastName","Accountant","employeeId","acct-new-"+tag,"email","acct-new-"+tag+"@example.test","password",password,"roleTypeId",rt,"stores",List.of(store,second),"modules",List.of(Map.of("moduleId",settingsModule,"view",true,"edit",false))));
  ok(req("admin","POST",access()+"/users",body),400);
  body.put("stores",List.of(store));body.put("password","short");ok(req("admin","POST",access()+"/users",body),400);
  body.put("password",password);body.put("modules",List.of(Map.of("moduleId",settingsModule,"view",false,"edit",true)));ok(req("admin","POST",access()+"/users",body),400);
  assertThat(db.queryForObject("SELECT count(*) FROM users WHERE email=?",Long.class,body.get("email"))).isZero();
  body.put("modules",List.of(Map.of("moduleId",settingsModule,"view",true,"edit",false)));
  body.remove("modules");
  body.put("roleTypeId",db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='ADMIN'",Long.class));ok(req("admin","POST",access()+"/users",body),403);
  body.put("roleTypeId",rt);ok(req("admin","POST",access()+"/users",body),201);
  ok(req("acct-new","GET",settings(),null),200);
 }

 @Test @Order(14) void roleMatrixIsolationStaleVersionsAndLegacyEndpoint() throws Exception {
  long rt=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  var body=Map.of("roleTypeId",rt,"code","GROCERY_VIEW_INVENTORY","allowed",true,"version","0");
  ok(req("other","PUT",access()+"/role-permissions",body),403);ok(req("manager","PUT",access()+"/role-permissions",body),403);
  ok(req("admin","PUT",access()+"/role-permissions",body),200);ok(req("admin","PUT",access()+"/role-permissions",body),409);
  assertThat(db.queryForObject("SELECT count(*) FROM store_role_permissions WHERE dgt_id=? AND permission_code='GROCERY_VIEW_INVENTORY'",Long.class,second)).isZero();
  ok(req("manager","GET","/reports/inventory",null),403);
  ok(req("admin","PUT",access()+"/permissions",Map.of("roleId",assignments.get("manager"),"moduleId",settingsModule,"view",true,"edit",true,"version","0")),410);
 }

 @Test @Order(15) void preferencesSaveAtomicallyAndRejectStaleBatch() throws Exception {
  long rt=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  var first=Map.of("roleTypeId",rt,"code","GROCERY_ADJUST_STOCK","allowed",true,"version","0");
  var invalid=Map.of("roleTypeId",rt,"code","UNKNOWN","allowed",true,"version","0");
  ok(req("admin","PUT",access()+"/role-permissions/batch",Map.of("changes",List.of(first,invalid))),400);
  assertThat(db.queryForObject("SELECT count(*) FROM store_role_permissions WHERE dgt_id=? AND permission_code='GROCERY_ADJUST_STOCK'",Long.class,store)).isZero();
  var second=Map.of("roleTypeId",rt,"code","GROCERY_REDUCE_STOCK","allowed",true,"version","0");
  var batch=Map.of("changes",List.of(first,second));
  ok(req("manager","PUT",access()+"/role-permissions/batch",batch),403);
  ok(req("admin","PUT",access()+"/role-permissions/batch",batch),200);
  ok(req("admin","PUT",access()+"/role-permissions/batch",batch),409);
  assertThat(db.queryForObject("SELECT count(*) FROM store_role_permissions WHERE dgt_id=? AND permission_code IN ('GROCERY_ADJUST_STOCK','GROCERY_REDUCE_STOCK') AND allowed",Long.class,store)).isEqualTo(2);
 }

 @Test @Order(16) void ownProfileAndPasswordChanges() throws Exception {
  db.update("INSERT INTO users(dgt_id,employee_id,first_name,last_name,email,password_hash) VALUES (?,?,?,?,?,?)",store,"profile-"+tag,"Profile","Test","profile-"+tag+"@example.test",new BCryptPasswordEncoder(4).encode(password));
  var profile=ok(req("profile","GET","/access/profile",null),200);assertThat(profile.toString()).doesNotContain("password","company_id","role_type_id");
  ok(req(null,"GET","/access/profile",null),401);
  String v=profile.path("version").asText();
  var changed=ok(call("profile","PATCH","/access/profile",Map.of("firstName","Updated","lastName","Person","email","profile-"+tag+"@example.test","user_id",users.get("admin")),v,null),200);
  assertThat(changed.path("first_name").asText()).isEqualTo("Updated");
  assertThat(db.queryForObject("SELECT first_name FROM users WHERE user_id=?",String.class,users.get("admin"))).isEqualTo("admin");
  ok(call("profile","PATCH","/access/profile",Map.of("firstName","Stale","lastName","Person","email","profile-"+tag+"@example.test"),v,null),409);
  v=changed.path("version").asText();
  ok(call("profile","PATCH","/access/profile",Map.of("firstName","Updated","lastName","Person","email","admin-"+tag+"@example.test","currentPassword",password),v,null),409);
  ok(call("profile","PATCH","/access/profile",Map.of("firstName","Updated","lastName","Person","email","profile2-"+tag+"@example.test","currentPassword","wrong"),v,null),400);
  changed=ok(call("profile","PATCH","/access/profile",Map.of("firstName","Updated","lastName","Person","email","profile2-"+tag+"@example.test","currentPassword",password),v,null),200);
  ok(req("profile","GET","/access/profile",null),401);ok(req("profile2","GET","/access/profile",null),200);
  v=changed.path("version").asText();String newPassword="Changed-profile-test-password";
  ok(call("profile2","PUT","/access/profile/password",Map.of("currentPassword","wrong","newPassword",newPassword,"confirmPassword",newPassword),v,null),400);
  ok(call("profile2","PUT","/access/profile/password",Map.of("currentPassword",password,"newPassword",newPassword,"confirmPassword","different"),v,null),400);
  ok(call("profile2","PUT","/access/profile/password",Map.of("currentPassword",password,"newPassword","short","confirmPassword","short"),v,null),400);
  ok(call("profile2","PUT","/access/profile/password",Map.of("currentPassword",password,"newPassword",newPassword,"confirmPassword",newPassword),v,null),200);
  ok(req("profile2","GET","/access/profile",null),401);
  var request=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1/access/profile")).header("Authorization","Basic "+Base64.getEncoder().encodeToString(("profile2-"+tag+"@example.test:"+newPassword).getBytes(StandardCharsets.UTF_8))).GET().build();
  assertThat(http.send(request,HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(200);
 }

 Response bearer(String token,String method,String path,Object body) throws Exception {
  var b=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path)).header("Authorization","Bearer "+token);
  if(body!=null)b.header("Content-Type","application/json").method(method,HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));else b.method(method,HttpRequest.BodyPublishers.noBody());
  var r=http.send(b.build(),HttpResponse.BodyHandlers.ofString());return new Response(r.statusCode(),r.body().isBlank()?json.createObjectNode():json.readTree(r.body()));
 }
 @Test @Order(17) void trackedSessionsArePrivateAndRevocationIsEnforced() throws Exception {
  var one=ok(req("manager","POST","/access/session",null),200);var two=ok(req("manager","POST","/access/session",null),200);
  String a=one.path("token").asText(),b=two.path("token").asText();String id=two.path("sessionId").asText();
  var sessions=ok(bearer(a,"GET","/access/profile/sessions",null),200);assertThat(sessions.size()).isEqualTo(2);assertThat(sessions.toString()).doesNotContain(a,b,"token_hash","credential_fingerprint");
  assertThat(sessions.findValues("current").stream().filter(JsonNode::asBoolean).count()).isEqualTo(1);
  assertThat(ok(bearer(a,"GET","/access/profile/history",null),200).size()).isEqualTo(2);
  ok(req("accountant","POST","/access/profile/sessions/"+id+"/revoke",null),404);
  ok(bearer(a,"POST","/access/profile/sessions/"+id+"/revoke",null),200);
  ok(bearer(b,"GET","/access/profile",null),401);ok(bearer(a,"GET","/access/profile",null),200);
  db.update("UPDATE user_sessions SET expires_at=CURRENT_TIMESTAMP-interval '1 second' WHERE session_id=CAST(? AS uuid)",one.path("sessionId").asText());
  ok(bearer(a,"GET","/access/profile",null),401);
  var three=ok(req("manager","POST","/access/session",null),200);String c=three.path("token").asText();
  ok(bearer(c,"POST","/access/session/logout",null),200);ok(bearer(c,"GET","/access/profile",null),401);
 }
 @Test @Order(18) void failedLoginRecordedAndPasswordChangeRevokesSessions() throws Exception {
  long id=db.queryForObject("INSERT INTO users(dgt_id,employee_id,first_name,last_name,email,password_hash) VALUES (?,?,?,?,?,?) RETURNING user_id",Long.class,store,"session-"+tag,"Session","Person","session-"+tag+"@example.test",new BCryptPasswordEncoder(4).encode(password));
  var wrong=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1/access/session")).header("Authorization","Basic "+Base64.getEncoder().encodeToString(("session-"+tag+"@example.test:wrong").getBytes(StandardCharsets.UTF_8))).POST(HttpRequest.BodyPublishers.noBody()).build();
  assertThat(http.send(wrong,HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(401);
  assertThat(db.queryForObject("SELECT count(*) FROM user_login_events WHERE user_id=? AND status='FAILED'",Long.class,id)).isEqualTo(1);
  String token=ok(req("session","POST","/access/session",null),200).path("token").asText();
  String version=ok(req("session","GET","/access/profile",null),200).path("version").asText();
  ok(call("session","PUT","/access/profile/password",Map.of("currentPassword",password,"newPassword","Session-password-changed","confirmPassword","Session-password-changed"),version,null),200);
  ok(bearer(token,"GET","/access/profile",null),401);
  assertThat(db.queryForObject("SELECT count(*) FROM user_sessions WHERE user_id=? AND revoked_at IS NOT NULL",Long.class,id)).isEqualTo(1);
 }

 long plan(String name){return db.queryForObject("SELECT subscription_plan_id FROM subscription_plans WHERE plan_name=?",Long.class,name);}
 JsonNode bill(String s) throws Exception{return ok(req("admin","GET","/access/stores/"+s+"/billing",null),200);}
 JsonNode billChange(String s,String action,Long plan,String key) throws Exception{
  var data=bill(s);String version=data.path("subscription").isNull()?"0":data.path("subscription").path("version").asText();
  Map<String,Object> body=new HashMap<>();body.put("action",action);body.put("planId",plan);body.put("version",version);
  return ok(call("admin","POST","/access/stores/"+s+"/billing",body,null,key),200);
 }
 @Test @Order(19) void billingUpgradeDowngradeAndReplay() throws Exception {
  ok(req("manager","GET",access()+"/billing",null),403);ok(req("other","GET",access()+"/billing",null),403);
  assertThat(bill(store).path("subscription").isNull()).isTrue();
  var first=billChange(store,"START",plan("Basic"),UUID.randomUUID().toString());assertThat(first.path("invoices").get(0).path("total_amount").decimalValue()).isEqualByComparingTo("60");
  String version=first.path("subscription").path("version").asText(),key=UUID.randomUUID().toString();
  var body=Map.of("action","CHANGE","planId",plan("Modern"),"version",version);
  var up=ok(call("admin","POST",access()+"/billing",body,null,key),200);assertThat(up.path("invoices").size()).isEqualTo(2);assertThat(up.path("invoices").get(0).path("total_amount").decimalValue()).isEqualByComparingTo("30");
  assertThat(ok(call("admin","POST",access()+"/billing",body,null,key),200).path("invoices").size()).isEqualTo(2);
  ok(call("admin","POST",access()+"/billing",body,null,UUID.randomUUID().toString()),409);
  var down=billChange(store,"CHANGE",plan("Basic"),UUID.randomUUID().toString());assertThat(down.path("subscription").path("monthly_price").decimalValue()).isEqualByComparingTo("60");assertThat(down.path("subscription").path("current_period_price").decimalValue()).isEqualByComparingTo("90");assertThat(down.path("invoices").size()).isEqualTo(2);
  assertThat(billChange(store,"CHANGE",plan("Modern"),UUID.randomUUID().toString()).path("invoices").size()).isEqualTo(2);
  assertThat(bill(second).path("subscription").isNull()).isTrue();
 }
 @Test @Order(20) void billingRenewalMonthEndAndCancellation() throws Exception {
  long sid=bill(store).path("subscription").path("subscription_id").asLong();
  db.update("UPDATE store_subscriptions SET start_date='2026-01-31',current_period_start='2026-01-31',current_period_end='2026-02-28',next_billing_date='2026-02-28' WHERE subscription_id=?",sid);
  billing.advance(store,java.time.LocalDate.of(2026,3,31));var renewed=bill(store);assertThat(renewed.path("subscription").path("current_period_start").asText()).isEqualTo("2026-03-31");assertThat(renewed.path("subscription").path("current_period_end").asText()).isEqualTo("2026-04-30");
  int count=renewed.path("invoices").size();billing.advance(store,java.time.LocalDate.of(2026,3,31));assertThat(bill(store).path("invoices").size()).isEqualTo(count);
  var start=billChange(second,"START",plan("Modern"),UUID.randomUUID().toString());var end=java.time.LocalDate.parse(start.path("subscription").path("current_period_end").asText());
  var down=billChange(second,"CHANGE",plan("Basic"),UUID.randomUUID().toString());assertThat(down.path("invoices").size()).isEqualTo(1);
  billing.advance(second,end);var lower=bill(second);assertThat(lower.path("invoices").get(0).path("total_amount").decimalValue()).isEqualByComparingTo("60");
  var cancelled=billChange(second,"CANCEL",null,UUID.randomUUID().toString());assertThat(cancelled.path("subscription").path("subscription_status").asText()).isEqualTo("ACTIVE");assertThat(cancelled.path("subscription").path("auto_renewal").asBoolean()).isFalse();
  billing.advance(second,java.time.LocalDate.parse(cancelled.path("subscription").path("current_period_end").asText()));var closed=bill(second);assertThat(closed.path("subscription").path("subscription_status").asText()).isEqualTo("CANCELLED");assertThat(closed.path("invoices").size()).isEqualTo(2);
 }

 @Test @Order(21) void addonBillingIsolationReplayAndCancellation() throws Exception {
  billing.advance(store,billing.today(store));
  var before=bill(store);long addon=before.path("addons").get(0).path("addon_id").asLong();
  String key=UUID.randomUUID().toString();var body=Map.of("action","ADDON_ADD","planId",addon,"version",before.path("subscription").path("version").asText());
  ok(call("manager","POST",access()+"/billing",body,null,key),403);
  var added=ok(call("admin","POST",access()+"/billing",body,null,key),200);
  assertThat(added.path("addons").get(0).path("active").asBoolean()).isTrue();
  assertThat(added.path("invoices").get(0).path("total_amount").decimalValue()).isEqualByComparingTo("10");
  int count=added.path("invoices").size();assertThat(ok(call("admin","POST",access()+"/billing",body,null,key),200).path("invoices").size()).isEqualTo(count);
  assertThat(bill(second).path("addons").get(0).path("active").asBoolean()).isFalse();
  var end=java.time.LocalDate.parse(added.path("subscription").path("current_period_end").asText());billing.advance(store,end);
  assertThat(bill(store).path("invoices").size()).isEqualTo(count+2);
  billing.advance(store,end);assertThat(bill(store).path("invoices").size()).isEqualTo(count+2);
  var cancelled=billChange(store,"ADDON_CANCEL",addon,UUID.randomUUID().toString());assertThat(cancelled.path("addons").get(0).path("active").asBoolean()).isTrue();
  billing.advance(store,java.time.LocalDate.parse(cancelled.path("subscription").path("current_period_end").asText()));
  assertThat(bill(store).path("addons").get(0).path("active").asBoolean()).isFalse();assertThat(bill(store).path("invoices").size()).isEqualTo(count+3);
 }
 @Test @Order(22) void scopedEmployeeCreateEditAndCashierAccount() throws Exception {
  db.update("UPDATE user_roles SET is_active=true WHERE user_role_id=?",assignments.get("cashier"));
  String path=access()+"/employees";
  ok(req("manager","GET",path,null),403);ok(req("other","GET",path,null),403);
  long role=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER'",Long.class);
  var body=new HashMap<String,Object>();body.put("userId",users.get("cashier"));body.put("roleTypeId",role);body.put("hireDate","2026-01-01");body.put("employeeType","Full-time");body.put("payType","Hourly");body.put("rate",18.50);body.put("status","Active");
  var created=ok(req("admin","POST",path,body),200);var employee=created.path("employees").get(0);long id=employee.path("id").asLong();
  assertThat(employee.path("rate").decimalValue()).isEqualByComparingTo("18.50");
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/employees",null),200).path("employees").size()).isZero();
  ok(req("admin","POST",path,body),409);
  body.put("version",employee.path("version").asText());body.put("rate",20);body.put("status","Inactive");var updated=ok(req("admin","PUT",path+"/"+id,body),200);assertThat(updated.path("employees").get(0).path("status").asText()).isEqualTo("Inactive");
  ok(req("admin","PUT",path+"/"+id,body),409);ok(req("other","PUT",path+"/"+id,body),403);
  body.remove("userId");body.put("status","Active");body.put("firstName","New");body.put("lastName","Employee");body.put("employeeCode","EMP-"+tag);body.put("email","employee-"+tag+"@example.test");body.put("password",password);
  var two=ok(req("admin","POST",path,body),200);assertThat(two.path("employees").size()).isEqualTo(2);
  assertThat(db.queryForObject("SELECT count(*) FROM user_roles ur JOIN users u USING(user_id) JOIN role_types rt USING(role_type_id) WHERE u.email=? AND rt.role_type_name='CASHIER' AND ur.dgt_id=?",Integer.class,"employee-"+tag+"@example.test",store)).isEqualTo(1);
 }
 @Test @Order(23) void sharedEmployeeEditUpdatesPayButKeepsOtherStoreActive() throws Exception {
  long id=db.queryForObject("SELECT employee_id FROM employees WHERE user_id=?",Long.class,users.get("cashier"));
  long role=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER'",Long.class);
  db.update("INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id) VALUES (?,?,false,'2026-01-01',?)",id,second,role);
  var employee=ok(req("admin","GET",access()+"/employees",null),200).path("employees").get(0);
  for(var row:ok(req("admin","GET",access()+"/employees",null),200).path("employees"))if(row.path("id").asLong()==id)employee=row;
  var body=new HashMap<String,Object>();body.put("hireDate","2026-01-01");body.put("employeeType","Part-time");body.put("payType","Hourly");body.put("rate",27);body.put("status","Inactive");body.put("version",employee.path("version").asText());
  ok(req("admin","PUT",access()+"/employees/"+id,body),200);
  var other=ok(req("admin","GET","/access/stores/"+second+"/employees",null),200).path("employees").get(0);
  assertThat(other.path("rate").decimalValue()).isEqualByComparingTo("27");assertThat(other.path("status").asText()).isEqualTo("Active");assertThat(other.path("store_count").asInt()).isEqualTo(2);
  ok(req("admin","PUT",access()+"/employees/"+id,body),409);
  db.update("INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id) VALUES (?,?,false,'2026-01-01',?)",id,foreign,role);
  body.put("version",other.path("version").asText());
  ok(req("admin","PUT","/access/stores/"+second+"/employees/"+id,body),400);
 }
 @Test @Order(24) void employeeIdentityUpdatesLoginAndRejectsDuplicateEmail() throws Exception {
  var all=ok(req("admin","GET",access()+"/employees",null),200).path("employees");JsonNode employee=null;
  for(var row:all)if(row.path("email").asText().equals("employee-"+tag+"@example.test"))employee=row;
  assertThat(employee).isNotNull();long id=employee.path("id").asLong();
  ok(req("employee","POST","/access/session",null),200);
  var body=new HashMap<String,Object>();body.put("hireDate","2026-01-01");body.put("employeeType","Full-time");body.put("payType","Hourly");body.put("rate",20);body.put("status","Active");body.put("version",employee.path("version").asText());body.put("firstName","Updated");body.put("lastName","Employee");body.put("email","admin-"+tag+"@example.test");
  ok(req("admin","PUT",access()+"/employees/"+id,body),409);
  body.put("email","renamed-"+tag+"@example.test");ok(req("admin","PUT",access()+"/employees/"+id,body),200);
  ok(req("employee","GET","/access/profile",null),401);var profile=ok(req("renamed","GET","/access/profile",null),200);assertThat(profile.path("first_name").asText()).isEqualTo("Updated");
  assertThat(db.queryForObject("SELECT count(*) FROM user_sessions WHERE user_id=? AND revoked_at IS NULL",Integer.class,employee.path("user_id").asLong())).isZero();
  ok(req("admin","PUT",access()+"/employees/"+id,body),409);
 }
 @Test @Order(25) void employeeDetailsRoundTripValidationAndStoreDepartmentScope() throws Exception {
  JsonNode employee=null;for(var row:ok(req("admin","GET",access()+"/employees",null),200).path("employees"))if(row.path("email").asText().equals("renamed-"+tag+"@example.test"))employee=row;
  assertThat(employee).isNotNull();long id=employee.path("id").asLong();
  var body=new HashMap<String,Object>();body.put("hireDate","2026-01-01");body.put("employeeType","Full-time");body.put("payType","Hourly");body.put("rate",20);body.put("status","Active");body.put("version",employee.path("version").asText());
  String department="default-"+db.queryForObject("SELECT min(department_id) FROM departments WHERE is_default",Long.class);
  var detail=new HashMap<String,Object>();detail.put("jobTitle","Deli Cook");detail.put("department",department);detail.put("deposit",Map.of("bankName","Sample Bank","accountHolder","Sample Employee","accountType","Checking","accountLastFour","1234","routingNumber","000000000","active",true));detail.put("deductions",List.of(Map.of("type","RETIREMENT","calculation","PERCENT","amount",3,"effectiveFrom","2026-01-01","active",true)));body.put("details",detail);
  var result=ok(req("admin","PUT",access()+"/employees/"+id,body),200);for(var row:result.path("employees"))if(row.path("id").asLong()==id)employee=row;
  assertThat(employee.path("job_title").asText()).isEqualTo("Deli Cook");assertThat(employee.path("department_key").asText()).isEqualTo(department);assertThat(employee.path("deposit").path("account_last_four").asText()).isEqualTo("1234");assertThat(employee.path("deductions").get(0).path("amount").decimalValue()).isEqualByComparingTo("3");
  body.put("version",employee.path("version").asText());detail.put("department","store-999999999");ok(req("admin","PUT",access()+"/employees/"+id,body),400);
  detail.put("department",department);detail.put("deductions",List.of(Map.of("type","RETIREMENT","calculation","PERCENT","amount",101,"effectiveFrom","2026-01-01","active",true)));ok(req("admin","PUT",access()+"/employees/"+id,body),400);
  detail.put("deductions",List.of(Map.of("type","RETIREMENT","calculation","PERCENT","amount",3,"effectiveFrom","2026-01-01","active",false)));ok(req("admin","PUT",access()+"/employees/"+id,body),200);
 }
 @Test @Order(26) void employeeCanExistBeforeWebsiteAccess() throws Exception {
  var body=new HashMap<String,Object>();body.put("withoutAccess",true);body.put("firstName","Standalone");body.put("lastName",tag);body.put("hireDate","2026-01-01");body.put("employeeType","Full-time");body.put("payType","Hourly");body.put("rate",18);body.put("status","Active");
  var created=ok(req("admin","POST",access()+"/employees",body),200);JsonNode employee=null;for(var row:created.path("employees"))if(row.path("last_name").asText().equals(tag))employee=row;
  assertThat(employee).isNotNull();assertThat(employee.path("user_id").isNull()).isTrue();long id=employee.path("id").asLong();
  body.put("version",employee.path("version").asText());body.put("firstName","Standalone edited");ok(req("admin","PUT",access()+"/employees/"+id,body),200);
  JsonNode accessRow=null;for(var row:ok(req("admin","GET",access()+"/employee-access",null),200))if(row.path("employee_id").asLong()==id)accessRow=row;
  long role=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER'",Long.class);
  var grant=new HashMap<String,Object>();grant.put("employeeCode","STAFF-"+tag);grant.put("email","standalone-"+tag+"@example.test");grant.put("password",password);grant.put("roleTypeId",role);grant.put("active",true);grant.put("version",accessRow.path("version").asText());
  ok(req("other","PUT",access()+"/employee-access/"+id,grant),403);
  var granted=ok(req("admin","PUT",access()+"/employee-access/"+id,grant),200);
  assertThat(db.queryForObject("SELECT employee_id FROM users WHERE email=?",String.class,"standalone-"+tag+"@example.test")).isEqualTo(Long.toString(id));
  ok(req("standalone","GET","/access/profile",null),200);ok(req("admin","PUT",access()+"/employee-access/"+id,grant),409);
  for(var row:granted)if(row.path("employee_id").asLong()==id)accessRow=row;
  grant.remove("password");grant.put("active",false);grant.put("version",accessRow.path("version").asText());ok(req("admin","PUT",access()+"/employee-access/"+id,grant),200);
  assertThat(ok(req("standalone","GET","/access/stores",null),200).size()).isZero();
 }

 Map<String,Object> bulkLinksFor(long product,Long group,List<Long> vendors,List<Long> promos) throws Exception {
  var options=ok(req("admin","GET",access()+"/items/bulk-options",null),200);var result=new LinkedHashMap<String,Object>();
  for(var row:options.path("links"))if(row.path("id").asLong()==product)result.put("version",row.path("version").asText());
  result.put("groupId",group);result.put("groupVersion",null);for(var row:options.path("groups"))if(group!=null&&row.path("id").asLong()==group)result.put("groupVersion",row.path("version").asText());
  var versions=new HashMap<String,String>();for(var row:options.path("promotions"))if(promos.contains(row.path("id").asLong()))versions.put(row.path("id").asText(),row.path("version").asText());
  result.put("vendorIds",vendors);result.put("promotionIds",promos);result.put("promotionVersions",versions);return result;
 }
 @Test @Order(35) void bulkEditableLinksAndIndividualPrice() throws Exception {
  String path=access()+"/items";var dep=ok(req("admin","GET",path,null),200).path("departments").get(0);
  var item=new LinkedHashMap<String,Object>();item.put("name","Editable links");item.put("sku","LINKS-"+tag);item.put("dept",dep.path("name").asText());item.put("subDept",dep.path("children").get(0).asText());item.put("retail",3);item.put("taxable",true);item.put("ebtSnap",false);item.put("allowReturns",true);item.put("active",true);item.put("unitType","item");item.put("purchaseGrossCost",1.49);item.put("purchaseDiscount",0);
  long id=ok(req("admin","POST",path,item),200).path("id").asLong();
  long seed=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? AND product_id<>? AND is_active ORDER BY product_id DESC LIMIT 1",Long.class,store,id);
  long vendor=db.queryForObject("INSERT INTO vendors(dgt_id,vendor_name) VALUES (?,?) RETURNING vendor_id",Long.class,store,"Bulk vendor");
  var groupInput=new LinkedHashMap<String,Object>();groupInput.put("name","Override group");groupInput.put("groupPrice",9.99);groupInput.put("products",List.of(id));
  long group=ok(req("admin","POST",access()+"/price-groups",groupInput),200).path("id").asLong();
  var promo=Map.of("name","Bulk assign promo","type","Bundle","products",List.of(Map.of("productId",seed,"quantity",2)),"discountValue",5,"start","2030-01-01","end","2030-02-01");
  long promotion=ok(req("admin","POST",access()+"/promotions",promo),200).path("id").asLong();
  item.put("name","Renamed in bulk");item.put("sku","LINKS-NEW-"+tag);item.put("barcode","BULKCODE-"+tag);item.put("retail",4.50);
  var links=bulkLinksFor(id,group,List.of(vendor),List.of(promotion));String version=db.queryForObject("SELECT xmin::text FROM products WHERE product_id=?",String.class,id);
  ok(req("admin","POST",path+"/bulk",Map.of("rows",List.of(Map.of("id",id,"version",version,"item",item,"links",links)))),200);
  assertThat(db.queryForObject("SELECT retail_price FROM product_store_prices WHERE product_id=?",java.math.BigDecimal.class,id)).isEqualByComparingTo("4.50");
  for(var row:ok(req("admin","GET",path,null),200).path("items"))if(row.path("id").asLong()==id){assertThat(row.path("retail").decimalValue()).isEqualByComparingTo("4.50");assertThat(row.path("effectiveRetail").decimalValue()).isEqualByComparingTo("9.99");}
  item.put("retail",5.25);String directVersion=db.queryForObject("SELECT xmin::text FROM products WHERE product_id=?",String.class,id);ok(call("admin","PUT",path+"/"+id,item,directVersion,null),200);
  assertThat(db.queryForObject("SELECT retail_price FROM product_store_prices WHERE product_id=?",java.math.BigDecimal.class,id)).isEqualByComparingTo("5.25");
  for(var row:ok(req("admin","GET",path,null),200).path("items"))if(row.path("id").asLong()==id)assertThat(row.path("effectiveRetail").decimalValue()).isEqualByComparingTo("9.99");
  assertThat(db.queryForObject("SELECT required_quantity FROM promotion_products WHERE promotion_id=? AND product_id=?",Integer.class,promotion,id)).isEqualTo(1);assertThat(db.queryForObject("SELECT required_quantity FROM promotion_products WHERE promotion_id=? AND product_id=?",Integer.class,promotion,seed)).isEqualTo(2);
  assertThat(db.queryForObject("SELECT unit_cost FROM product_vendors WHERE product_id=? AND vendor_id=?",java.math.BigDecimal.class,id,vendor)).isEqualByComparingTo("1.49");
  links=bulkLinksFor(id,null,List.of(vendor),List.of(promotion));version=db.queryForObject("SELECT xmin::text FROM products WHERE product_id=?",String.class,id);
  db.update("UPDATE product_vendors SET updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND vendor_id=?",id,vendor);
  ok(req("admin","POST",path+"/bulk",Map.of("rows",List.of(Map.of("id",id,"version",version,"item",item,"links",links)))),409);
  links=bulkLinksFor(id,null,List.of(),List.of());ok(req("admin","POST",path+"/bulk",Map.of("rows",List.of(Map.of("id",id,"version",version,"item",item,"links",links)))),200);
  assertThat(db.queryForObject("SELECT retail_price FROM product_store_prices WHERE product_id=?",java.math.BigDecimal.class,id)).isEqualByComparingTo("5.25");assertThat(db.queryForObject("SELECT count(*) FROM product_vendors WHERE archived_at IS NULL AND product_id=?",Integer.class,id)).isZero();
  assertThat(db.queryForObject("SELECT count(*) FROM promotion_products WHERE promotion_id=? AND product_id=?",Integer.class,promotion,seed)).isEqualTo(1);
  for(var g:ok(req("admin","GET",access()+"/price-groups",null),200).path("groups"))if(g.path("id").asLong()==group)assertThat(g.path("items").size()).isZero();
 }

 @Test @Order(34) void bulkItemsReuseRulesAndRollbackEntireBatch() throws Exception {
  String path=access()+"/items";var dep=ok(req("admin","GET",path,null),200).path("departments").get(0);
  var in=new LinkedHashMap<String,Object>();in.put("name","Bulk A");in.put("sku","BULK-A-"+tag);in.put("dept",dep.path("name").asText());in.put("subDept",dep.path("children").get(0).asText());in.put("retail",3);in.put("taxable",true);in.put("ebtSnap",false);in.put("allowReturns",true);in.put("active",true);in.put("unitType","item");in.put("purchaseGrossCost",1.49);in.put("purchaseDiscount",0);
  long first=ok(req("admin","POST",path,in),200).path("id").asLong();var otherIn=new LinkedHashMap<String,Object>(in);otherIn.put("name","Bulk B");otherIn.put("sku","BULK-B-"+tag);long last=ok(req("admin","POST",path,otherIn),200).path("id").asLong();
  String v1=db.queryForObject("SELECT xmin::text FROM products WHERE product_id=?",String.class,first),v2=db.queryForObject("SELECT xmin::text FROM products WHERE product_id=?",String.class,last);
  in.put("purchaseGrossCost",1.79);in.put("currentInventory",12.5);in.put("inventoryVersion","0");otherIn.put("retail",-1);
  var rows=List.of(Map.of("id",first,"version",v1,"item",in),Map.of("id",last,"version",v2,"item",otherIn));
  ok(req("admin","POST",path+"/bulk",Map.of("rows",rows)),400);
  assertThat(db.queryForObject("SELECT purchase_gross_cost FROM products WHERE product_id=?",java.math.BigDecimal.class,first)).isEqualByComparingTo("1.49");assertThat(db.queryForObject("SELECT count(*) FROM inventory WHERE product_id=?",Integer.class,first)).isZero();
  otherIn.put("retail",4);ok(req("cashier","POST",path+"/bulk",Map.of("rows",rows)),403);
  var pending=ok(req("manager","POST",path+"/bulk",Map.of("rows",rows)),200);assertThat(pending.path("pending").asBoolean()).isTrue();
  ok(req("admin","POST",access()+"/approvals/"+pending.path("requestId").asLong()+"/decision",Map.of("decision","APPROVED")),200);
  assertThat(db.queryForObject("SELECT purchase_gross_cost FROM products WHERE product_id=?",java.math.BigDecimal.class,first)).isEqualByComparingTo("1.79");assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE product_id=?",java.math.BigDecimal.class,first)).isEqualByComparingTo("12.5");
  assertThat(db.queryForObject("SELECT count(*) FROM access_audit_events WHERE event_type='ITEM_CATALOG_COST_CHANGED' AND target_id=?",Integer.class,Long.toString(first))).isEqualTo(1);
  ok(req("admin","POST",path+"/bulk",Map.of("rows",rows)),409);
  long foreignId=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? LIMIT 1",Long.class,second);ok(req("admin","POST",path+"/bulk",Map.of("rows",List.of(Map.of("id",foreignId,"version","0","item",in)))),409);
 }

 @Test @Order(33) void currentStockUsesStoreInventoryAndMovements() throws Exception {
  String path=access()+"/current-stock";
  long id=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? ORDER BY product_id LIMIT 1",Long.class,store);
  db.update("UPDATE products SET purchase_unit='CASE',units_per_case=10,purchase_gross_cost=19.90,purchase_discount=2 WHERE product_id=?",id);
  db.update("INSERT INTO inventory(dgt_id,product_id,available_quantity) VALUES (?,?,12.5) ON CONFLICT(dgt_id,product_id) DO UPDATE SET available_quantity=12.5",store,id);
  db.update("INSERT INTO inventory_movements(dgt_id,product_id,movement_type,qty_changed,unit_cost) VALUES (?,?,'ADJUSTMENT',2.5,1)",store,id);
  var rows=ok(req("manager","GET",path,null),200).path("items");JsonNode item=null;for(var row:rows)if(row.path("id").asLong()==id)item=row;
  assertThat(item).isNotNull();assertThat(item.path("onHandQty").decimalValue()).isEqualByComparingTo("12.5");assertThat(item.path("currentUnitCost").decimalValue()).isEqualByComparingTo("1.79");assertThat(item.path("inventoryValue").decimalValue()).isEqualByComparingTo("22.38");assertThat(item.path("vendors").isArray()).isTrue();
  var movements=ok(req("admin","GET",path+"/"+id+"/movements",null),200).path("movements");assertThat(movements.get(0).path("qty").decimalValue()).isEqualByComparingTo("2.5");
  long other=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? LIMIT 1",Long.class,second);
  ok(req("admin","GET",path+"/"+other+"/movements",null),404);ok(req("cashier","GET",path,null),403);ok(req("other","GET",path,null),403);
  for(var row:rows)assertThat(row.path("id").asLong()).isNotEqualTo(other);
 }

 @Test @Order(32) void priceGroupsUpdateRetailAndPreserveUnlinkedPrices() throws Exception {
  String path=access()+"/price-groups";
  var ids=db.queryForList("SELECT product_id FROM products WHERE dgt_id=? AND is_active ORDER BY product_id LIMIT 2",Long.class,store);long p1=ids.get(0),p2=ids.get(1);
  var old1=db.queryForObject("SELECT retail_price FROM product_store_prices WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,p1);var old2=db.queryForObject("SELECT retail_price FROM product_store_prices WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,p2);
  var body=new LinkedHashMap<String,Object>();body.put("name","Group test");body.put("description","Retail group");body.put("groupPrice",3.49);body.put("products",ids);
  String key=UUID.randomUUID().toString();long id=ok(call("admin","POST",path,body,null,key),200).path("id").asLong();assertThat(id).isPositive();assertThat(ok(call("admin","POST",path,body,null,key),200).path("id").asLong()).isEqualTo(id);
  assertThat(db.queryForObject("SELECT retail_price FROM product_store_prices WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,p1)).isEqualByComparingTo(old1);
  assertThat(ok(req("admin","GET",access()+"/items",null),200).toString()).contains("Group test");
  ok(req("cashier","GET",path,null),403);ok(req("other","GET",path,null),403);
  var row=ok(req("manager","GET",path,null),200).path("groups").get(0);String version=row.path("version").asText();
  body.put("name","Duplicate membership");ok(req("admin","POST",path,body),409);
  long other=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? LIMIT 1",Long.class,second);body.put("products",List.of(other));ok(req("admin","POST",path,body),400);
  assertThatThrownBy(()->db.update("INSERT INTO product_price_groups(price_group_id,product_id,dgt_id) VALUES (?,?,?)",id,other,store)).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
  body.put("name","Group test");body.put("products",List.of(p1));body.put("groupPrice",4.99);
  ok(call("admin","PUT",path+"/"+id,body,version,null),200);ok(call("admin","PUT",path+"/"+id,body,version,null),409);
  assertThat(db.queryForObject("SELECT retail_price FROM product_store_prices WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,p1)).isEqualByComparingTo(old1);
  for(var item:ok(req("admin","GET",access()+"/items",null),200).path("items"))if(item.path("id").asLong()==p1)assertThat(item.path("effectiveRetail").decimalValue()).isEqualByComparingTo("4.99");
  assertThat(db.queryForObject("SELECT retail_price FROM product_store_prices WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,p2)).isEqualByComparingTo(old2);
  row=ok(req("admin","GET",path,null),200).path("groups").get(0);
  ok(call("admin","POST",path+"/"+id+"/deactivate",Map.of(),row.path("version").asText(),null),200);
  assertThat(db.queryForObject("SELECT retail_price FROM product_store_prices WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,p1)).isEqualByComparingTo(old1);
  assertThat(db.queryForObject("SELECT count(*) FROM product_price_groups WHERE price_group_id=? AND archived_at IS NULL AND NOT is_active",Integer.class,id)).isEqualTo(1);
  for(var item:ok(req("admin","GET",access()+"/items",null),200).path("items"))if(item.path("id").asLong()==p1)assertThat(item.path("effectiveRetail").decimalValue()).isEqualByComparingTo(old1);
  body.put("name","Manager group");var pending=ok(req("manager","POST",path,body),200);assertThat(pending.path("pending").asBoolean()).isTrue();
  ok(req("admin","POST",access()+"/approvals/"+pending.path("requestId").asLong()+"/decision",Map.of("decision","APPROVED")),200);
  assertThat(db.queryForObject("SELECT count(*) FROM product_price_groups WHERE dgt_id=? AND product_id=? AND is_active",Integer.class,store,p1)).isEqualTo(1);
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/price-groups",null),200).path("groups").size()).isZero();
 }

 @Test @Order(31) void promotionsRulesIsolationAndDeactivation() throws Exception {
  String path=access()+"/promotions";
  var products=db.queryForList("SELECT product_id FROM products WHERE dgt_id=? AND is_active ORDER BY product_id LIMIT 2",Long.class,store);long p1=products.get(0),p2=products.get(1);
  var body=new LinkedHashMap<String,Object>();body.put("name","Mix & Match");body.put("type","Buy X Get Y");body.put("products",List.of(Map.of("productId",p1,"quantity",1),Map.of("productId",p2,"quantity",1)));body.put("buyQty",2);body.put("freeQty",1);body.put("start","2030-01-01");body.put("end","2030-01-31");
  body.put("buyQty",2.5);ok(req("admin","POST",path,body),400);body.put("buyQty",2);
  String key=UUID.randomUUID().toString();long id=ok(call("admin","POST",path,body,null,key),200).path("id").asLong();
  assertThat(ok(call("admin","POST",path,body,null,key),200).path("id").asLong()).isEqualTo(id);
  body.put("name","Different retry");ok(call("admin","POST",path,body,null,key),409);body.put("name","Mix & Match");
  var list=ok(req("manager","GET",path,null),200);var row=list.path("promotions").get(0);assertThat(row.path("products").size()).isEqualTo(2);assertThat(row.path("buyQty").asInt()).isEqualTo(2);assertThat(row.path("status").asText()).isEqualTo("Upcoming");
  ok(req("cashier","GET",path,null),403);ok(req("other","GET",path,null),403);
  long foreignProduct=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? LIMIT 1",Long.class,second);
  var wrong=new LinkedHashMap<String,Object>(body);wrong.put("products",List.of(Map.of("productId",foreignProduct,"quantity",1)));ok(req("admin","POST",path,wrong),400);
  assertThatThrownBy(()->db.update("INSERT INTO promotion_products(promotion_id,product_id,dgt_id) VALUES (?,?,?)",id,foreignProduct,store)).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
  body.put("type","Bundle");body.remove("buyQty");body.remove("freeQty");body.put("discountValue",4.99);body.put("products",List.of(Map.of("productId",p1,"quantity",2),Map.of("productId",p2,"quantity",1)));
  ok(call("manager","PUT",path+"/"+id,body,row.path("version").asText(),null),200);
  ok(call("manager","PUT",path+"/"+id,body,row.path("version").asText(),null),409);
  assertThat(db.queryForObject("SELECT required_quantity FROM promotion_products WHERE promotion_id=? AND product_id=?",Integer.class,id,p1)).isEqualTo(2);
  row=ok(req("admin","GET",path,null),200).path("promotions").get(0);
  ok(call("admin","POST",path+"/"+id+"/deactivate",Map.of(),row.path("version").asText(),null),200);
  row=ok(req("admin","GET",path,null),200).path("promotions").get(0);assertThat(row.path("status").asText()).isEqualTo("Inactive");assertThat(row.path("products").size()).isEqualTo(2);
  ok(call("admin","PUT",path+"/"+id,body,row.path("version").asText(),null),409);
  body.put("type","% Discount");body.put("products",List.of(Map.of("productId",p1,"quantity",1)));body.put("discountValue",101);ok(req("admin","POST",path,body),400);
  body.put("discountValue",10);body.put("end","2029-01-01");ok(req("admin","POST",path,body),400);
  body.put("start",java.time.LocalDate.now().minusDays(2).toString());body.put("end",java.time.LocalDate.now().plusDays(2).toString());body.put("name","Active percent");
  long activeId=ok(req("admin","POST",path,body),200).path("id").asLong();
  assertThat(ok(req("admin","GET",path,null),200).path("promotions").get(0).path("status").asText()).isEqualTo("Active");
  // A one-day promotion over the DST transition uses 23 hours, not a fixed 24.
  db.update("UPDATE stores SET timezone='America/New_York' WHERE dgt_id=?",second);
  var dst=new LinkedHashMap<String,Object>(body);dst.put("products",List.of(Map.of("productId",foreignProduct,"quantity",1)));dst.put("type","Fixed Price");dst.put("discountValue",1.5);dst.put("start","2027-03-14");dst.put("end","2027-03-14");
  long dstId=ok(req("admin","POST","/access/stores/"+second+"/promotions",dst),200).path("id").asLong();
  assertThat(db.queryForObject("SELECT EXTRACT(EPOCH FROM (end_date-start_date))+0.000001 FROM promotions WHERE promotion_id=?",java.math.BigDecimal.class,dstId)).isEqualByComparingTo("82800");
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/promotions",null),200).path("promotions").size()).isEqualTo(1);
  long module=db.queryForObject("SELECT module_id FROM modules WHERE module_name='PRICE_BOOK'",Long.class);
  db.update("INSERT INTO module_approval_policies(company_id,module_id,manager_requires_admin) VALUES (?,?,true) ON CONFLICT(company_id,module_id) DO UPDATE SET manager_requires_admin=true",company,module);
  body.put("name","Needs approval");var pending=ok(req("manager","POST",path,body),200);assertThat(pending.path("pending").asBoolean()).isTrue();
  assertThat(db.queryForObject("SELECT count(*) FROM promotions WHERE dgt_id=? AND promotion_name='Needs approval'",Integer.class,store)).isZero();
  ok(req("admin","POST",access()+"/approvals/"+pending.path("requestId").asLong()+"/decision",Map.of("decision","APPROVED")),200);
  assertThat(db.queryForObject("SELECT count(*) FROM promotions WHERE dgt_id=? AND promotion_name='Needs approval'",Integer.class,store)).isEqualTo(1);
 }

 @Test @Order(30) void catalogCostChangesAppearInHistory() throws Exception {
  String path=access()+"/items";var dep=ok(req("admin","GET",path,null),200).path("departments").get(0);
  var body=new LinkedHashMap<String,Object>();body.put("name","Catalog history item");body.put("sku","HISTORY-"+tag);body.put("dept",dep.path("name").asText());body.put("subDept",dep.path("children").get(0).asText());body.put("retail",2.5);body.put("taxable",false);body.put("ebtSnap",false);body.put("allowReturns",true);body.put("active",true);body.put("unitType","item");body.put("purchaseGrossCost",1.49);body.put("purchaseDiscount",0);
  long id=ok(req("admin","POST",path,body),200).path("id").asLong();
  String version=db.queryForObject("SELECT xmin::text FROM products WHERE product_id=?",String.class,id);
  body.put("purchaseGrossCost",1.79);ok(call("manager","PUT",path+"/"+id,body,version,null),200);
  var history=ok(req("admin","GET",access()+"/vendors/pricing",null),200).path("history");
  var entry=java.util.stream.StreamSupport.stream(history.spliterator(),false).filter(x->x.path("item").asText().equals("Catalog history item")).findFirst().orElseThrow();
  assertThat(entry.path("oldCost").asDouble()).isEqualTo(1.49);assertThat(entry.path("newCost").asDouble()).isEqualTo(1.79);assertThat(entry.path("change").asDouble()).isEqualTo(20.13);assertThat(entry.path("source").asText()).isEqualTo("MANUAL:CATALOG");
  version=db.queryForObject("SELECT xmin::text FROM products WHERE product_id=?",String.class,id);
  ok(call("manager","PUT",path+"/"+id,body,version,null),200);
  assertThat(db.queryForObject("SELECT count(*) FROM access_audit_events WHERE event_type='ITEM_CATALOG_COST_CHANGED' AND dgt_id=? AND target_id=?",Integer.class,store,Long.toString(id))).isEqualTo(1);
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/vendors/pricing",null),200).path("history").toString()).doesNotContain("Catalog history item");
 }

 @Test @Order(29) void vendorItemTermsAndUnlink() throws Exception {
  String path=access()+"/vendors";
  long product=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? AND product_sku=?",Long.class,store,"DETAILS-"+tag);
  long vendor=ok(req("admin","POST",path,Map.of("name","Terms vendor","active",true,"leadTime",7)),200).path("id").asLong();
  String links=path+"/"+vendor+"/items";
  var input=new LinkedHashMap<String,Object>();input.put("productId",product);input.put("unitCost",24);input.put("unitType","CASE");input.put("moq",2);
  ok(req("admin","POST",links,input),200);
  var row=ok(req("admin","GET",links,null),200).get(0);
  var listed=java.util.stream.StreamSupport.stream(ok(req("admin","GET",access()+"/items",null),200).path("items").spliterator(),false).filter(x->x.path("id").asLong()==product).findFirst().orElseThrow();
  assertThat(listed.path("vendor").asText()).isEqualTo("Terms vendor");assertThat(listed.path("vendorNames").get(0).asText()).isEqualTo("Terms vendor");

  assertThat(row.path("casePackSize").asInt()).isEqualTo(24);assertThat(row.path("moq").asInt()).isEqualTo(2);assertThat(row.path("leadTime").asInt()).isEqualTo(7);assertThat(row.path("category").asText()).isNotBlank();
  input.put("unitCost",30);input.put("casePackSize",24);input.put("moq",3);
  ok(call("cashier","PUT",links+"/"+product,input,row.path("version").asText(),null),403);
  ok(call("manager","PUT",links+"/"+product,input,row.path("version").asText(),null),200);
  ok(call("manager","PUT",links+"/"+product,input,row.path("version").asText(),null),409);
  row=ok(req("admin","GET",links,null),200).get(0);assertThat(row.path("unitCost").asInt()).isEqualTo(30);assertThat(row.path("moq").asInt()).isEqualTo(3);
  assertThat(db.queryForObject("SELECT count(*) FROM vendor_item_cost_history WHERE vendor_id=? AND product_id=?",Integer.class,vendor,product)).isEqualTo(1);
  input.put("moq",0);ok(call("admin","PUT",links+"/"+product,input,row.path("version").asText(),null),400);
  ok(call("other","DELETE",links+"/"+product,null,row.path("version").asText(),null),403);
  ok(call("admin","DELETE",links+"/"+product,null,row.path("version").asText(),null),200);
  assertThat(ok(req("admin","GET",links,null),200).size()).isZero();
  var unlinked=java.util.stream.StreamSupport.stream(ok(req("admin","GET",access()+"/items",null),200).path("items").spliterator(),false).filter(x->x.path("id").asLong()==product).findFirst().orElseThrow();
  assertThat(unlinked.path("vendor").asText()).isEmpty();assertThat(unlinked.path("vendorNames").size()).isZero();

  assertThat(db.queryForObject("SELECT count(*) FROM products WHERE product_id=?",Integer.class,product)).isEqualTo(1);
  assertThat(db.queryForObject("SELECT count(*) FROM vendor_item_cost_history WHERE vendor_id=? AND product_id=?",Integer.class,vendor,product)).isEqualTo(1);
 }

 @Test @Order(28) void itemDefaultsAndInventory() throws Exception {
  String path=access()+"/items";var dep=ok(req("admin","GET",path,null),200).path("departments").get(0);
  var body=new LinkedHashMap<String,Object>();body.put("name","Case details");body.put("sku","DETAILS-"+tag);body.put("dept",dep.path("name").asText());body.put("subDept",dep.path("children").get(0).asText());body.put("retail",1.50);body.put("taxable",true);body.put("ebtSnap",false);body.put("allowReturns",true);body.put("active",true);
  body.put("ageRestricted",true);body.put("unitType","case");body.put("unitsPerCase",24);body.put("purchaseGrossCost",24);body.put("purchaseDiscount",2.40);body.put("currentInventory",48);body.put("inventoryVersion","0");body.put("reorderLevel",10);
  long id=ok(req("admin","POST",path,body),200).path("id").asLong();
  var item=java.util.stream.StreamSupport.stream(ok(req("admin","GET",path,null),200).path("items").spliterator(),false).filter(x->x.path("id").asLong()==id).findFirst().orElseThrow();
  assertThat(item.path("cost").asDouble()).isEqualTo(0.9);assertThat(item.path("caseNetCost").asDouble()).isEqualTo(21.6);assertThat(item.path("ageRestricted").asBoolean()).isTrue();assertThat(item.path("currentInventory").asInt()).isEqualTo(48);
  assertThat(db.queryForObject("SELECT sum(qty_changed) FROM inventory_movements WHERE product_id=?",java.math.BigDecimal.class,id)).isEqualByComparingTo("48");
  body.put("currentInventory",40);ok(call("admin","PUT",path+"/"+id,body,item.path("version").asText(),null),409);
  body.put("inventoryVersion",item.path("inventoryVersion").asText());body.put("purchaseDiscount",25);ok(call("admin","PUT",path+"/"+id,body,item.path("version").asText(),null),400);
  body.put("purchaseDiscount",2.4);ok(call("admin","PUT",path+"/"+id,body,item.path("version").asText(),null),200);
  assertThat(db.queryForObject("SELECT sum(qty_changed) FROM inventory_movements WHERE product_id=?",java.math.BigDecimal.class,id)).isEqualByComparingTo("40");
  assertThat(db.queryForObject("SELECT count(*) FROM product_vendors WHERE archived_at IS NULL AND product_id=?",Integer.class,id)).isZero();
 }

 @Test @Order(27) void priceBookPersistenceAndStoreIsolation() throws Exception {
  String path=access()+"/items";
  var initial=ok(req("admin","GET",path,null),200);
  var dep=initial.path("departments").get(0);
  assertThat(dep.path("children").size()).isGreaterThan(0);
  var body=new LinkedHashMap<String,Object>();body.put("name","Price Book test");body.put("sku","CODE-"+tag);body.put("barcode","BAR-"+tag);body.put("dept",dep.path("name").asText());body.put("subDept",dep.path("children").get(0).asText());body.put("retail",1.99);body.put("taxable",true);body.put("ebtSnap",false);body.put("allowReturns",true);body.put("active",true);
  long id=ok(req("admin","POST",path,body),200).path("id").asLong();
  ok(req("admin","POST",path,body),400);
  long secondId=ok(req("admin","POST","/access/stores/"+second+"/items",body),200).path("id").asLong();assertThat(secondId).isNotEqualTo(id);
  ok(req("other","GET",path,null),403);
  ok(req("cashier","GET","/access/stores/"+second+"/items",null),403);
  var item=ok(req("admin","GET",path,null),200).path("items").get(0);assertThat(item.path("id").asLong()).isEqualTo(id);assertThat(item.path("retail").asDouble()).isEqualTo(1.99);
  long barcodeId=db.queryForObject("SELECT product_barcode_id FROM product_barcodes WHERE product_id=?",Long.class,id);
  body.put("barcode","");
  ok(call("admin","PUT",path+"/"+id,body,item.path("version").asText(),null),200);
  assertThat(db.queryForObject("SELECT archived_at IS NOT NULL FROM product_barcodes WHERE product_barcode_id=?",Boolean.class,barcodeId)).isTrue();
  item=ok(req("admin","GET",path,null),200).path("items").get(0);
  assertThat(item.path("barcode").asText("")).isEmpty();
  body.put("barcode","BAR-"+tag);
  ok(call("admin","PUT",path+"/"+id,body,item.path("version").asText(),null),200);
  assertThat(db.queryForObject("SELECT product_barcode_id FROM product_barcodes WHERE product_id=? AND archived_at IS NULL",Long.class,id)).isEqualTo(barcodeId);
  item=ok(req("admin","GET",path,null),200).path("items").get(0);
  body.put("name","Changed item");body.put("retail",2.49);
  ok(call("admin","PUT",path+"/"+id,body,item.path("version").asText(),null),200);
  ok(call("admin","PUT",path+"/"+id,body,item.path("version").asText(),null),409);
  ok(call("admin","PUT","/access/stores/"+second+"/items/"+id,body,item.path("version").asText(),null),409);
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/items",null),200).path("items").get(0).path("name").asText()).isEqualTo("Price Book test");
  assertThatThrownBy(()->db.update("UPDATE product_store_prices SET dgt_id=? WHERE dgt_id=? AND product_id=?",second,store,id)).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
  assertThat(ok(req("admin","GET",path,null),200).path("items").get(0).path("name").asText()).isEqualTo("Changed item");

  for(String who:List.of("cashier","accountant","manager")){
   db.update("UPDATE users SET account_status='ACTIVE',two_factor_authentication=false WHERE user_id=?",users.get(who));
   db.update("UPDATE user_roles SET is_active=true WHERE user_role_id=?",assignments.get(who));
   ok(req(who,"GET",path,null),403);ok(req(who,"POST",path,body),403);
  }
  long role=db.queryForObject("SELECT role_type_id FROM user_roles WHERE user_role_id=?",Long.class,assignments.get("manager"));
  ok(req("admin","PUT",access()+"/role-permissions",Map.of("roleTypeId",role,"code","PRICE_BOOK_ACCESS","allowed",true,"version","0")),200);
  ok(req("manager","GET",path,null),200);
  body.put("sku","MANAGER-"+tag);body.put("barcode","MANAGER-BAR-"+tag);body.put("name","Manager item");
  assertThat(ok(req("manager","POST",path,body),200).path("saved").asBoolean()).isTrue();
  String vp=access()+"/vendors";var vb=Map.of("name","Vendor "+tag,"contactName","Representative "+tag,"email","vendor@example.test","phone","5551234567","paymentTerms","Net 30","leadTime",2,"active",true);
  long vid=ok(req("admin","POST",vp,vb),200).path("id").asLong();assertThat(vid).isPositive();
  var vl=ok(req("admin","GET",vp,null),200);assertThat(vl.size()).isEqualTo(1);assertThat(vl.get(0).path("name").asText()).isEqualTo("Vendor "+tag);
  ok(req("other","GET",vp,null),403);ok(req("cashier","GET",vp,null),403);
  var link=Map.of("productId",id,"unitCost",0.99,"unitType","ITEM");
  ok(req("manager","POST",vp+"/"+vid+"/items",link),200);assertThat(ok(req("manager","POST",vp+"/"+vid+"/items",link),200).path("alreadyLinked").asBoolean()).isTrue();
  assertThat(ok(req("admin","GET",vp+"/"+vid+"/items",null),200).size()).isEqualTo(1);
  ok(req("admin","POST",vp+"/"+vid+"/items",Map.of("productId",secondId,"unitCost",1,"unitType","ITEM")),400);
  ok(call("admin","PUT",vp+"/"+vid,vb,vl.get(0).path("version").asText(),null),200);
  ok(call("admin","PUT",vp+"/"+vid,vb,vl.get(0).path("version").asText(),null),409);
  ok(req("admin","POST",vp+"/"+vid+"/invoices/0/link-new-items",null),400);
  var prefs=Map.of("priceChangeAlerts",true,"alertThreshold",5,"approvalRequired",true,"approvalThreshold",10,"autoPick",true,"fallback",false,"considerLeadTime",true);
  assertThat(ok(req("admin","GET",vp+"/pricing",null),200).path("configured").asBoolean()).isFalse();
  var priced=ok(call("manager","PUT",vp+"/pricing",prefs,"0",null),200);assertThat(priced.path("settings").path("alertThreshold").asDouble()).isEqualTo(5);assertThat(priced.path("configured").asBoolean()).isTrue();
  ok(call("manager","PUT",vp+"/pricing",prefs,"0",null),409);
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/vendors/pricing",null),200).path("configured").asBoolean()).isFalse();
  ok(req("cashier","GET",vp+"/pricing",null),403);ok(req("other","GET",vp+"/audit",null),403);
  var log=ok(req("manager","GET",vp+"/audit",null),200);assertThat(log.toString()).contains("VENDOR_PRICING_PREFERENCES_UPDATED").contains("VENDOR_ITEM_LINKED");
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/vendors/audit",null),200).size()).isZero();
  for(long product:List.of(id,secondId))db.update("INSERT INTO vendor_item_cost_history(product_id,vendor_id,old_cost,new_cost,change_percentage,effective_date,change_source,changed_by) VALUES (?,?,1,2,100,CURRENT_DATE,'TEST',?)",product,vid,users.get("admin"));
  var costHistory=ok(req("admin","GET",vp+"/pricing",null),200).path("history");assertThat(costHistory.size()).isEqualTo(1);assertThat(costHistory.get(0).path("newCost").asDouble()).isEqualTo(2);
  var invalidPrefs=new LinkedHashMap<String,Object>(prefs);invalidPrefs.put("alertThreshold",-1);ok(call("admin","PUT",vp+"/pricing",invalidPrefs,priced.path("settings").path("version").asText(),null),400);

  assertThat(ok(req("admin","GET",vp,null),200).get(0).path("contactName").asText()).isEqualTo("Representative "+tag);
  var contract=new LinkedHashMap<String,Object>();contract.put("vendorId",vid);contract.put("contractNumber","CON-"+tag);contract.put("startDate","2026-01-01");contract.put("endDate","2026-12-31");contract.put("status","Active");contract.put("discountValue",5);contract.put("discountType","PERCENT");contract.put("returnWindowDays",14);
  var types=ok(req("manager","GET",vp+"/contracts",null),200).path("types");assertThat(types.size()).isEqualTo(12);
  for(var type:types){contract.put("contractType",type.asText());ok(req("manager","POST",vp+"/contracts",contract),200);}
  var contracts=ok(req("admin","GET",vp+"/contracts",null),200).path("contracts");assertThat(contracts.size()).isEqualTo(12);assertThat(contracts.get(0).path("contractNumber").asText()).isEqualTo("CON-"+tag);assertThat(contracts.get(0).path("discountValue").asDouble()).isEqualTo(5);
  var firstContract=contracts.get(0);long cid=firstContract.path("id").asLong();String cv=firstContract.path("version").asText();
  contract.put("returnPolicy","14 days, full refund");contract.put("status","Pending");
  contract.remove("contractNumber");
  ok(call("manager","PUT",vp+"/contracts/"+cid,contract,cv,null),200);
  ok(call("manager","PUT",vp+"/contracts/"+cid,contract,cv,null),409);
  ok(call("admin","PUT","/access/stores/"+second+"/vendors/contracts/"+cid,contract,cv,null),409);
  var changed=ok(req("admin","GET",vp+"/contracts",null),200).path("contracts");
  for(var row:changed)if(row.path("id").asLong()==cid){assertThat(row.path("returnPolicy").asText()).isEqualTo("14 days, full refund");assertThat(row.path("status").asText()).isEqualTo("Pending");assertThat(row.path("contractNumber").asText()).isEqualTo("CON-"+tag);}
  ok(req("cashier","POST",vp+"/contracts",contract),403);ok(req("other","GET",vp+"/contracts",null),403);
  ok(req("admin","POST","/access/stores/"+second+"/vendors/contracts",contract),404);
  contract.put("contractType","Unsupported");ok(req("admin","POST",vp+"/contracts",contract),400);
  contract.put("contractType",types.get(0).asText());contract.put("endDate","2025-01-01");ok(req("admin","POST",vp+"/contracts",contract),400);
  contract.put("endDate","2026-12-31");contract.put("discountValue",101);ok(req("admin","POST",vp+"/contracts",contract),400);

  body.put("sku","INVOICE-"+tag);body.put("barcode","INV-BAR-"+tag);long newProduct=ok(req("admin","POST",path,body),200).path("id").asLong();
  long oldProduct=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? AND product_sku=?",Long.class,store,"MANAGER-"+tag);
  long invoiceId=db.queryForObject("INSERT INTO invoices(dgt_id,vendor_id,invoice_number,invoice_type,invoice_date,received_by,approved_by,approved_at) VALUES (?,?,?,'GROCERY',CURRENT_DATE,?,?,CURRENT_TIMESTAMP) RETURNING invoice_id",Long.class,store,vid,"INV-"+tag,users.get("admin"),users.get("admin"));
  for(long product:List.of(newProduct,oldProduct))db.update("INSERT INTO grocery_invoice_items(invoice_id,product_id,quantity,unit_type,unit_cost,item_line_total,is_product_new) VALUES (?,?,1,'ITEM',2,2,?)",invoiceId,product,product==newProduct);
  assertThat(ok(req("admin","POST",vp+"/"+vid+"/invoices/"+invoiceId+"/link-new-items",null),200).path("linked").asInt()).isEqualTo(1);
  assertThat(ok(req("admin","POST",vp+"/"+vid+"/invoices/"+invoiceId+"/link-new-items",null),200).path("linked").asInt()).isZero();
  assertThat(db.queryForObject("SELECT count(*) FROM product_vendors WHERE archived_at IS NULL AND product_id=? AND vendor_id=?",Integer.class,oldProduct,vid)).isZero();


  String arrivalsPath="/access/stores/"+store+"/new-arrivals";
  var arrivals=ok(req("admin","GET",arrivalsPath,null),200).path("arrivals");
  assertThat(arrivals.size()).isEqualTo(1);assertThat(arrivals.get(0).path("id").asLong()).isEqualTo(newProduct);
  ok(req("other","GET",arrivalsPath,null),403);ok(req("cashier","GET",arrivalsPath,null),403);
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/new-arrivals",null),200).path("arrivals").size()).isZero();
  db.update("UPDATE grocery_invoice_items SET unit_type='CASE',case_pack_quantity=12,quantity=2,unit_cost=24 WHERE invoice_id=? AND product_id=?",invoiceId,newProduct);
  db.update("UPDATE grocery_invoice_items SET msrp=3.49 WHERE invoice_id=? AND product_id=?",invoiceId,newProduct);
  long originalSub=db.queryForObject("SELECT store_sub_department_id FROM products WHERE product_id=?",Long.class,newProduct);
  long arrivalDept=db.queryForObject("SELECT store_department_id FROM store_sub_departments WHERE store_sub_department_id=?",Long.class,originalSub);
  long pendingSub=db.queryForObject("INSERT INTO store_sub_departments(dgt_id,store_department_id,store_sub_department_name,source_type) VALUES (?,?,'Pending arrival','UNCLASSIFIED') RETURNING store_sub_department_id",Long.class,store,arrivalDept);
  db.update("UPDATE products SET store_sub_department_id=? WHERE product_id=?",pendingSub,newProduct);
  String effectiveSql="SELECT "+com.dgt.backend.pricebook.ItemSellingPrice.SQL+" FROM products p LEFT JOIN product_store_prices pr ON pr.product_id=p.product_id AND pr.dgt_id=p.dgt_id WHERE p.product_id=?";
  assertThat(db.queryForObject(effectiveSql,java.math.BigDecimal.class,newProduct)).isEqualByComparingTo("3.49");
  // MSRP remains per unit even when the invoice purchase unit is a case.
  var caseArrival=ok(req("admin","GET",arrivalsPath,null),200).path("arrivals").get(0);
  assertThat(caseArrival.path("unitsReceived").asDouble()).isEqualTo(24);assertThat(caseArrival.path("cost").asDouble()).isEqualTo(2);
  assertThat(caseArrival.path("msrp").asDouble()).isEqualTo(3.49);
  String arrivalVersion=db.queryForObject("SELECT xmin::text FROM products WHERE product_id=?",String.class,newProduct);
  body.put("retail",4.00);
  ok(call("admin","PUT",path+"/"+newProduct,body,arrivalVersion,null),200);
  assertThat(db.queryForObject(effectiveSql,java.math.BigDecimal.class,newProduct)).isEqualByComparingTo("4.00");
  assertThat(ok(req("admin","GET",arrivalsPath,null),200).path("arrivals").get(0).path("needsCategory").asBoolean()).isFalse();
  db.update("UPDATE invoices SET approved_at=NULL WHERE invoice_id=?",invoiceId);
  assertThat(ok(req("admin","GET",arrivalsPath,null),200).path("arrivals").size()).isZero();
  db.update("UPDATE invoices SET approved_at=CURRENT_TIMESTAMP WHERE invoice_id=?",invoiceId);
  db.update("UPDATE grocery_invoice_items SET unit_type='ITEM',case_pack_quantity=NULL,quantity=1,unit_cost=2 WHERE invoice_id=? AND product_id=?",invoiceId,newProduct);
  var linked=ok(req("admin","GET",vp+"/pricing/items",null),200);
  var selected=java.util.stream.StreamSupport.stream(linked.spliterator(),false).filter(x->x.path("item").asText().equals(body.get("name"))).findFirst().orElse(linked.get(0));
  String costPath=vp+"/pricing/items/"+selected.path("id").asLong()+"/cost";
  ok(call("manager","PUT",costPath,Map.of("cost",1.49),selected.path("version").asText(),null),200);
  ok(call("manager","PUT",costPath,Map.of("cost",1.79),selected.path("version").asText(),null),409);
  ok(call("cashier","PUT",costPath,Map.of("cost",1.79),"0",null),403);
  ok(req("other","POST",vp+"/pricing/invoice-costs",null),403);
  assertThat(ok(req("admin","POST",vp+"/pricing/invoice-costs",null),200).path("recorded").asInt()).isZero();
  db.update("UPDATE grocery_invoice_items SET unit_cost=1.49 WHERE invoice_id=? AND product_id=?",invoiceId,oldProduct);
  long nextInvoice=db.queryForObject("INSERT INTO invoices(dgt_id,vendor_id,invoice_number,invoice_type,invoice_date,received_by,approved_by,approved_at) VALUES (?,?,?,'GROCERY',CURRENT_DATE+1,?,?,CURRENT_TIMESTAMP) RETURNING invoice_id",Long.class,store,vid,"NEXT-"+tag,users.get("admin"),users.get("admin"));
  db.update("INSERT INTO grocery_invoice_items(invoice_id,product_id,quantity,unit_type,unit_cost,item_line_total,is_product_new) VALUES (?,?,20,'ITEM',1.79,35.80,false)",nextInvoice,oldProduct);
  assertThat(ok(req("admin","POST",vp+"/pricing/invoice-costs",null),200).path("recorded").asInt()).isEqualTo(1);
  assertThat(ok(req("admin","POST",vp+"/pricing/invoice-costs",null),200).path("recorded").asInt()).isZero();
  assertThat(db.queryForObject("SELECT change_percentage FROM vendor_item_cost_history WHERE product_id=? AND change_source LIKE 'INVOICE:%'",java.math.BigDecimal.class,oldProduct)).isEqualByComparingTo("20.13");
  var histories=ok(req("admin","GET",vp+"/pricing",null),200).path("history");
  assertThat(histories.toString()).contains("NEXT-"+tag).contains("INV-"+tag);
  long thirdInvoice=db.queryForObject("INSERT INTO invoices(dgt_id,vendor_id,invoice_number,invoice_type,invoice_date,received_by,approved_by,approved_at) VALUES (?,?,?,'GROCERY',CURRENT_DATE+2,?,?,CURRENT_TIMESTAMP) RETURNING invoice_id",Long.class,store,vid,"THIRD-"+tag,users.get("admin"),users.get("admin"));
  db.update("INSERT INTO grocery_invoice_items(invoice_id,product_id,quantity,unit_type,unit_cost,item_line_total,is_product_new) VALUES (?,?,1,'ITEM',1.79,1.79,false)",thirdInvoice,oldProduct);
  assertThat(ok(req("admin","POST",vp+"/pricing/invoice-costs",null),200).path("recorded").asInt()).isZero();
  long fourthInvoice=db.queryForObject("INSERT INTO invoices(dgt_id,vendor_id,invoice_number,invoice_type,invoice_date,received_by,approved_by,approved_at) VALUES (?,?,?,'GROCERY',CURRENT_DATE+3,?,?,CURRENT_TIMESTAMP) RETURNING invoice_id",Long.class,store,vid,"FOURTH-"+tag,users.get("admin"),users.get("admin"));
  db.update("INSERT INTO grocery_invoice_items(invoice_id,product_id,quantity,unit_type,unit_cost,item_line_total,is_product_new) VALUES (?,?,1,'ITEM',0,0,false)",fourthInvoice,oldProduct);
  assertThat(ok(req("admin","POST",vp+"/pricing/invoice-costs",null),200).path("recorded").asInt()).isEqualTo(1);
  assertThat(db.queryForObject("SELECT min(change_percentage) FROM vendor_item_cost_history WHERE product_id=?",java.math.BigDecimal.class,oldProduct)).isEqualByComparingTo("-100");

  assertThat(db.queryForObject("SELECT count(*) FROM product_vendors WHERE archived_at IS NULL AND product_id=? AND vendor_id=?",Integer.class,oldProduct,vid)).isZero();


  ok(req("manager","GET","/access/stores/"+second+"/items",null),403);
  for(String who:List.of("cashier","accountant")){
   long deniedRole=db.queryForObject("SELECT role_type_id FROM user_roles WHERE user_role_id=?",Long.class,assignments.get(who));
   ok(req("admin","PUT",access()+"/role-permissions",Map.of("roleTypeId",deniedRole,"code","PRICE_BOOK_ACCESS","allowed",true,"version","0")),403);
   db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) VALUES (?,?,'PRICE_BOOK_ACCESS',true)",store,deniedRole);
   ok(req(who,"GET",path,null),403);ok(req(who,"POST",path,body),403);
  }
 }

 @Test @Order(36) void manualInvoiceMsrpAndApproval() throws Exception {
  String entry="/access/stores/"+store+"/invoice-entry";
  String vendor=db.queryForObject("SELECT vendor_name FROM vendors WHERE dgt_id=? AND is_active ORDER BY vendor_id LIMIT 1",String.class,store);
  var line=Map.of("sku","ARRIVAL-"+tag,"barcode","ARR-"+tag,"itemName","New invoice item","quantity",2,"unitType","case","unitsPerCase",12,"unitCost",24,"msrp",3.49);
  var input=Map.of("vendor",vendor,"invoice","ENTRY-"+tag,"deliveryDate",java.time.LocalDate.now().toString(),"lines",List.of(line));
  ok(req("cashier","POST",entry,input),403);ok(req("other","POST",entry,input),403);
  long id=ok(req("admin","POST",entry,input),200).path("id").asLong();
  long product=db.queryForObject("SELECT product_id FROM grocery_invoice_items WHERE archived_at IS NULL AND invoice_id=?",Long.class,id);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory WHERE product_id=?",Integer.class,product)).isZero();
  assertThat(db.queryForObject("SELECT msrp FROM grocery_invoice_items WHERE invoice_id=?",java.math.BigDecimal.class,id)).isEqualByComparingTo("3.49");
  ok(req("admin","POST",entry,input),409);
  ok(req("other","POST",entry+"/"+id+"/approve",null),403);
  ok(req("admin","POST",entry+"/"+id+"/approve",null),200);
  ok(req("admin","POST",entry+"/"+id+"/approve",null),200);
  assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE product_id=?",java.math.BigDecimal.class,product)).isEqualByComparingTo("24");
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE product_id=?",Integer.class,product)).isEqualTo(1);
  assertThat(db.queryForObject("SELECT "+com.dgt.backend.pricebook.ItemSellingPrice.SQL+" FROM products p LEFT JOIN product_store_prices pr ON pr.product_id=p.product_id AND pr.dgt_id=p.dgt_id WHERE p.product_id=?",java.math.BigDecimal.class,product)).isEqualByComparingTo("3.49");
  assertThat(ok(req("admin","GET",entry+"/"+id,null),200).path("items").get(0).path("msrp").asDouble()).isEqualTo(3.49);
 }

 @Test @Order(37) void reductionQueueApprovalRoutesAndOnceOnly() throws Exception {
  String path="/access/stores/"+store+"/reductions";
  long pid=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? AND product_sku=?",Long.class,store,"ARRIVAL-"+tag);
  for(String who:List.of("cashier","manager")){
   long role=db.queryForObject("SELECT role_type_id FROM user_roles WHERE user_role_id=?",Long.class,assignments.get(who));
   for(String code:List.of("GROCERY_VIEW_INVENTORY","GROCERY_REDUCE_STOCK","GROCERY_ADJUST_STOCK"))db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) VALUES (?,?,?,true) ON CONFLICT(dgt_id,role_type_id,permission_code) DO UPDATE SET allowed=true",store,role,code);
  }
  var input=Map.of("productId",pid,"quantity",2.5,"reason","damaged-returnable");
  long id=ok(req("cashier","POST",path,input),200).path("id").asLong();
  assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE product_id=?",java.math.BigDecimal.class,pid)).isEqualByComparingTo("24");
  ok(req("cashier","POST",path,input),409);
  ok(req("cashier","POST",path+"/"+id+"/decision",Map.of("status","APPROVED")),403);
  ok(req("other","GET",path,null),403);
  ok(req("manager","POST",path+"/"+id+"/decision",Map.of("status","APPROVED")),200);
  ok(req("manager","POST",path+"/"+id+"/decision",Map.of("status","APPROVED")),409);
  assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE product_id=?",java.math.BigDecimal.class,pid)).isEqualByComparingTo("21.5");
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=? AND product_id=? AND movement_type='ADJUSTMENT' AND reference_id=?",Integer.class,store,pid,id)).isEqualTo(1);
  assertThat(db.queryForObject("SELECT qty_changed FROM inventory_movements WHERE dgt_id=? AND product_id=? AND movement_type='ADJUSTMENT' AND reference_id=?",java.math.BigDecimal.class,store,pid,id)).isEqualByComparingTo("-2.5");
  assertThat(ok(req("cashier","GET",path,null),200).path("requests").get(0).path("route").asText()).isEqualTo("returnable");
  long reject=ok(req("cashier","POST",path,Map.of("productId",pid,"quantity",1,"reason","theft")),200).path("id").asLong();
  ok(req("admin","POST",path+"/"+reject+"/decision",Map.of("status","REJECTED","note","Not confirmed")),200);
  assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE product_id=?",java.math.BigDecimal.class,pid)).isEqualByComparingTo("21.5");
  ok(req("cashier","POST",path,Map.of("productId",pid,"quantity",99,"reason","theft")),400);
  long stale=ok(req("cashier","POST",path,Map.of("productId",pid,"quantity",21,"reason","theft")),200).path("id").asLong();
  db.update("UPDATE inventory SET available_quantity=1 WHERE product_id=?",pid);
  ok(req("admin","POST",path+"/"+stale+"/decision",Map.of("status","APPROVED")),409);
  assertThat(db.queryForObject("SELECT status FROM inventory_reduction_requests WHERE reduction_request_id=?",String.class,stale)).isEqualTo("PENDING");
  for(long unposted:List.of(reject,stale))assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=? AND product_id=? AND movement_type='ADJUSTMENT' AND reference_id=?",Integer.class,store,pid,unposted)).isZero();
  var automatic=ok(req("admin","POST",path,Map.of("productId",pid,"quantity",0.5,"reason","theft")),200);
  assertThat(automatic.path("pending").asBoolean()).isFalse();
  long autoId=automatic.path("id").asLong();
  assertThat(db.queryForObject("SELECT status FROM inventory_reduction_requests WHERE reduction_request_id=?",String.class,autoId)).isEqualTo("APPROVED");
  assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE product_id=?",java.math.BigDecimal.class,pid)).isEqualByComparingTo("0.5");
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=? AND product_id=? AND movement_type='ADJUSTMENT' AND reference_id=?",Integer.class,store,pid,autoId)).isEqualTo(1);
  ok(req("admin","POST",path+"/"+autoId+"/decision",Map.of("status","APPROVED")),409);

 }


 @Test @Order(38) void returnSlipTracking() throws Exception {
  String base="/access/stores/"+store+"/reductions";
  long id=db.queryForObject("SELECT reduction_request_id FROM inventory_reduction_requests WHERE dgt_id=? AND status='APPROVED' AND request_type='returnable' LIMIT 1",Long.class,store);
  long vendor=db.queryForObject("SELECT vendor_id FROM vendors WHERE dgt_id=? LIMIT 1",Long.class,store);
  var before=db.queryForObject("SELECT sum(available_quantity) FROM inventory WHERE dgt_id=?",java.math.BigDecimal.class,store);
  var body=Map.of("requestId",id,"vendorId",vendor,"reason","Damaged in transit","method","Pickup","reference","RMA-TEST");
  ok(req("cashier","POST",base+"/return-slips",body),403);
  long rid=ok(req("admin","POST",base+"/return-slips",body),200).path("id").asLong();
  ok(req("admin","POST",base+"/return-slips",body),409);
  var listing=ok(req("admin","GET",base+"/return-slips",null),200).path("returns").get(0);
  assertThat(listing.path("reference_number").asText()).isEqualTo("RMA-TEST");
  assertThat(listing.path("items").size()).isEqualTo(1);
  String status=base+"/return-slips/"+rid+"/status";
  ok(req("admin","POST",status,Map.of("status","CLOSED")),409);
  for(String next:List.of("PENDING","SENT","CREDIT_RECEIVED","CLOSED"))ok(req("manager","POST",status,Map.of("status",next)),200);
  ok(req("manager","POST",status,Map.of("status","CLOSED")),409);
  assertThat(db.queryForObject("SELECT sum(available_quantity) FROM inventory WHERE dgt_id=?",java.math.BigDecimal.class,store)).isEqualByComparingTo(before);
 }

 @Test @Order(39) void recordedLossUsesMovementCost() throws Exception {
  String path="/access/stores/"+store+"/reductions";
  long pid=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? AND product_sku=?",Long.class,store,"ARRIVAL-"+tag);
  long id=ok(req("admin","POST",path,Map.of("productId",pid,"quantity",0.25,"reason","damaged-non-returnable")),200).path("id").asLong();
  var first=ok(req("admin","GET",path,null),200).path("requests").get(0);
  assertThat(first.path("reduction_request_id").asLong()).isEqualTo(id);
  assertThat(first.path("recorded_loss").asDouble()).isEqualTo(0.5);
  db.update("UPDATE products SET purchase_gross_cost=120 WHERE product_id=?",pid);
  assertThat(ok(req("admin","GET",path,null),200).path("requests").get(0).path("recorded_loss").asDouble()).isEqualTo(0.5);
 }

 @Test @Order(39) void transferReceiptAndRecordedLoss() throws Exception {
  String source="/access/stores/"+store+"/reductions",destination="/access/stores/"+second+"/reductions";
  long pid=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? AND product_sku=?",Long.class,store,"ARRIVAL-"+tag);
  db.update("UPDATE inventory SET available_quantity=20 WHERE product_id=?",pid);
  long id=ok(req("admin","POST",source,Map.of("productId",pid,"quantity",10,"reason","store-to-store-transfer","destination",second)),200).path("id").asLong();
  long target=db.queryForObject("SELECT product_id FROM products WHERE dgt_id=? LIMIT 1",Long.class,second);
  var old=db.queryForObject("SELECT COALESCE(sum(available_quantity),0) FROM inventory WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,second,target);
  ok(req("admin","POST",source+"/transfers/"+id+"/receive",Map.of("productId",target,"totalReceived",8)),403);
  ok(req("admin","POST",destination+"/transfers/"+id+"/receive",Map.of("productId",pid,"totalReceived",8)),400);
  ok(req("admin","POST",destination+"/transfers/"+id+"/receive",Map.of("productId",target,"totalReceived",8)),200);
  ok(req("admin","POST",destination+"/transfers/"+id+"/receive",Map.of("productId",target,"totalReceived",8)),409);
  assertThat(ok(req("admin","GET",destination+"/transfers",null),200).path("transfers").get(0).path("transfer_status").asText()).isEqualTo("PARTIAL");
  ok(req("admin","POST",destination+"/transfers/"+id+"/receive",Map.of("productId",target,"totalReceived",11)),409);
  ok(req("admin","POST",destination+"/transfers/"+id+"/receive",Map.of("productId",target,"totalReceived",10)),200);
  assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE product_id=? AND dgt_id=?",java.math.BigDecimal.class,target,second)).isEqualByComparingTo(old.add(java.math.BigDecimal.TEN));
  long loss=ok(req("admin","POST",source,Map.of("productId",pid,"quantity",2,"reason","damaged-non-returnable")),200).path("id").asLong();
  var first=ok(req("admin","GET",source,null),200).path("requests").get(0);
  assertThat(first.path("reduction_request_id").asLong()).isEqualTo(loss);
  assertThat(first.path("recorded_loss").asDouble()).isEqualTo(20.0);
 }

 @Test @Order(99) void editPendingInvoiceOnly() throws Exception {
  String path="/access/stores/"+store+"/invoice-entry";
  String vendor=db.queryForObject("SELECT vendor_name FROM vendors WHERE dgt_id=? AND is_active LIMIT 1",String.class,store);
  var line=Map.of("sku","EDIT-"+tag,"itemName","Editable item","quantity",1,"unitType","item","unitCost",2,"msrp",3);
  var input=Map.of("vendor",vendor,"invoice","EDIT-"+tag,"deliveryDate","2026-09-12","lines",List.of(line));
  long id=ok(req("admin","POST",path,input),200).path("id").asLong();
  String version=ok(req("admin","GET",path+"/"+id,null),200).path("version").asText();
  var changed=Map.of("vendor",vendor,"invoice","EDIT-"+tag,"deliveryDate","2026-09-12","lines",List.of(Map.of("sku","EDIT-"+tag,"itemName","Editable item","quantity",4,"unitType","item","unitCost",2,"msrp",4)));
  ok(call("other","PUT",path+"/"+id,changed,version,null),403);
  ok(call("admin","PUT",path+"/"+id,changed,version,null),200);
  ok(call("admin","PUT",path+"/"+id,changed,version,null),409);
  assertThat(db.queryForObject("SELECT is_product_new FROM grocery_invoice_items WHERE archived_at IS NULL AND invoice_id=?",Boolean.class,id)).isTrue();
  assertThat(db.queryForObject("SELECT quantity FROM grocery_invoice_items WHERE invoice_id=? AND archived_at IS NOT NULL",java.math.BigDecimal.class,id)).isEqualByComparingTo("1");
  long pid=db.queryForObject("SELECT product_id FROM grocery_invoice_items WHERE archived_at IS NULL AND invoice_id=?",Long.class,id);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE product_id=?",Integer.class,pid)).isZero();
  version=ok(req("admin","GET",path+"/"+id,null),200).path("version").asText();
  ok(req("admin","POST",path+"/"+id+"/approve",null),200);
  ok(call("admin","PUT",path+"/"+id,input,version,null),409);
  assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE product_id=?",java.math.BigDecimal.class,pid)).isEqualByComparingTo("4");
 }

 @Test @Order(100) void purchaseOrdersScopedAndDraftLifecycle() throws Exception {
  String path="/access/stores/"+store+"/purchase-orders";
  var catalog=ok(req("admin","GET",path+"/catalog",null),200);assertThat(catalog.size()).isGreaterThan(0);var item=catalog.get(0);
  var input=Map.of("vendor",item.path("vendor").asText(),"source","Suggested Order Guide","lines",List.of(Map.of("sku",item.path("sku").asText(),"orderedQuantity",12,"unitCost",0)));
  String key=UUID.randomUUID().toString();
  var first=ok(call("admin","POST",path,input,null,key),200);var repeated=ok(call("admin","POST",path,input,null,key),200);assertThat(repeated.path("po_number").asText()).isEqualTo(first.path("po_number").asText());
  ok(req("cashier","GET",path,null),403);
  ok(req("other","GET",path,null),403);
  var order=ok(req("admin","GET",path,null),200).get(0);String id=order.path("id").asText(),version=order.path("version").asText();
  assertThat(order.path("totalQuantity").asDouble()).isEqualTo(12);
  ok(call("admin","POST",path+"/"+id+"/lines",List.of(Map.of("sku",item.path("sku").asText(),"orderedQuantity",6)),version,null),200);
  ok(call("admin","POST",path+"/"+id+"/lines",List.of(Map.of("sku",item.path("sku").asText(),"orderedQuantity",6)),version,null),409);
  order=ok(req("admin","GET",path,null),200).get(0);assertThat(order.path("totalQuantity").asDouble()).isEqualTo(18);version=order.path("version").asText();
  ok(call("admin","POST",path+"/"+id+"/status",Map.of("status","Pending Approval"),version,null),200);
  order=ok(req("admin","GET",path,null),200).get(0);version=order.path("version").asText();
  ok(call("admin","POST",path+"/"+id+"/lines",List.of(Map.of("sku",item.path("sku").asText(),"orderedQuantity",6)),version,null),409);
  ok(call("admin","POST",path+"/"+id+"/status",Map.of("status","Received"),version,null),409);
  ok(call("admin","POST",path+"/"+id+"/status",Map.of("status","Cancelled"),version,null),200);
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/purchase-orders",null),200).size()).isZero();
 }
 @Test @Order(101) void employeePoApprovalAndInvoiceReceiving() throws Exception {
  String poPath=access()+"/purchase-orders", invoicePath=access()+"/invoice-entry";
  for(String role:List.of("CASHIER","MANAGER"))for(String code:List.of("GROCERY_CREATE_PO","GROCERY_APPROVE_PO"))db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) SELECT ?,role_type_id,?,true FROM role_types WHERE role_type_name=? ON CONFLICT(dgt_id,role_type_id,permission_code) DO UPDATE SET allowed=true",store,code,role);
  var item=ok(req("cashier","GET",poPath+"/catalog",null),200).get(0);
  long pid=item.path("product_id").asLong();String sku=item.path("sku").asText(),vendor=item.path("vendor").asText();
  var before=db.queryForObject("SELECT COALESCE(sum(available_quantity),0) FROM inventory WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,pid);
  var create=Map.of("vendor",vendor,"source","Suggested Order Guide","lines",List.of(Map.of("sku",sku,"orderedQuantity",12)));
  ok(req("cashier","POST",poPath,create),200);
  var po=ok(req("cashier","GET",poPath,null),200).get(0);String poId=po.path("id").asText();
  assertThat(po.path("canEdit").asBoolean()).isTrue();assertThat(po.path("canApprove").asBoolean()).isFalse();
  ok(call("cashier","POST",poPath+"/"+poId+"/status",Map.of("status","Pending Approval"),po.path("version").asText(),null),200);
  po=ok(req("cashier","GET",poPath,null),200).get(0);
  ok(call("cashier","POST",poPath+"/"+poId+"/status",Map.of("status","Approved"),po.path("version").asText(),null),403);
  var line=new LinkedHashMap<String,Object>();line.put("sku",sku);line.put("itemName",item.path("name").asText());line.put("quantity",2);line.put("receivedQuantity",1);line.put("unitType","case");line.put("unitsPerCase",6);line.put("unitCost",9);line.put("tax",1.2);line.put("msrp",2.5);
  var invoice=new LinkedHashMap<String,Object>();invoice.put("vendor",vendor);invoice.put("invoice","PO-LINK-"+tag);invoice.put("deliveryDate","2026-09-13");invoice.put("purchaseOrderId",poId);invoice.put("lines",List.of(line));
  ok(req("admin","POST",invoicePath,invoice),400);
  ok(call("manager","POST",poPath+"/"+poId+"/status",Map.of("status","Approved"),po.path("version").asText(),null),200);
  po=ok(req("admin","GET",poPath,null),200).get(0);assertThat(po.path("status").asText()).isEqualTo("Approved");
  ok(call("cashier","POST",poPath+"/"+poId+"/lines",List.of(Map.of("sku",sku,"orderedQuantity",1)),po.path("version").asText(),null),409);
  assertThat(db.queryForObject("SELECT COALESCE(sum(available_quantity),0) FROM inventory WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,pid)).isEqualByComparingTo(before);
  assertThat(ok(req("admin","GET",invoicePath+"/pending-pos",null),200).get(0).path("pending").asBoolean()).isTrue();
  db.update("INSERT INTO vendors(dgt_id,vendor_name) VALUES (?,?)",store,"Wrong PO Vendor "+tag);
  invoice.put("vendor","Wrong PO Vendor "+tag);ok(req("admin","POST",invoicePath,invoice),400);invoice.put("vendor",vendor);
  ok(req("other","POST",invoicePath,invoice),403);
  long id=ok(req("admin","POST",invoicePath,invoice),200).path("id").asLong();
  var detail=ok(req("admin","GET",invoicePath+"/"+id,null),200);assertThat(detail.path("purchaseOrderId").asText()).isEqualTo(poId);assertThat(detail.path("items").get(0).path("orderedQty").asDouble()).isEqualTo(2);assertThat(detail.path("items").get(0).path("receivedQty").asDouble()).isEqualTo(1);assertThat(detail.path("items").get(0).path("total").asDouble()).isEqualTo(19.2);
  line.put("tax",1.5);ok(call("admin","PUT",invoicePath+"/"+id,invoice,detail.path("version").asText(),null),200);
  line.put("receivedQuantity",-1);ok(call("admin","PUT",invoicePath+"/"+id,invoice,ok(req("admin","GET",invoicePath+"/"+id,null),200).path("version").asText(),null),400);line.put("receivedQuantity",1);
  assertThat(db.queryForObject("SELECT COALESCE(sum(available_quantity),0) FROM inventory WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,pid)).isEqualByComparingTo(before);
  ok(req("admin","POST",invoicePath+"/"+id+"/approve",null),200);ok(req("admin","POST",invoicePath+"/"+id+"/approve",null),200);
  assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,pid)).isEqualByComparingTo(before.add(new java.math.BigDecimal("6")));
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=? AND reference_id=? AND movement_type='PURCHASE'",Integer.class,store,id)).isEqualTo(1);
  assertThat(db.queryForObject("SELECT status FROM purchase_orders WHERE purchase_order_id=?",String.class,Long.parseLong(poId))).isEqualTo("Approved");
  assertThat(ok(req("admin","GET",invoicePath+"/pending-pos",null),200).get(0).path("pending").asBoolean()).isTrue();
  invoice.put("invoice","PO-LINK-SECOND-"+tag);long secondInvoice=ok(req("admin","POST",invoicePath,invoice),200).path("id").asLong();ok(req("admin","POST",invoicePath+"/"+secondInvoice+"/approve",null),200);
  assertThat(ok(req("admin","GET",invoicePath+"/pending-pos",null),200).get(0).path("pending").asBoolean()).isFalse();
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/invoice-entry/pending-pos",null),200).size()).isZero();
 }

 @Test @Order(102) void invoiceDeliveryDatesAndChargesPersist() throws Exception {
  String path=access()+"/invoice-entry";
  var item=ok(req("admin","GET",access()+"/purchase-orders/catalog",null),200).get(0);long pid=item.path("product_id").asLong();
  var before=db.queryForObject("SELECT COALESCE(sum(available_quantity),0) FROM inventory WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,pid);
  var body=new LinkedHashMap<String,Object>();body.put("vendor",item.path("vendor").asText());body.put("invoice","DELIVERY-"+tag);body.put("invoiceDate","2026-09-13");body.put("deliveryDate","2026-09-12");body.put("deliveryTime","22:15");body.put("dueDate","2026-10-13");body.put("driverName","Test Driver");body.put("driverNumber","DRV-007");body.put("routeId","ROUTE-9");body.put("terms","Net 30");body.put("notes","Leave invoice with manager");body.put("freight",5.5);body.put("fuelSurcharge",2.25);body.put("handlingFee",1.5);body.put("discount",3);
  body.put("lines",List.of(Map.of("sku",item.path("sku").asText(),"itemName",item.path("name").asText(),"quantity",5,"receivedQuantity",2,"unitType","item","unitsPerCase",1,"unitCost",10,"tax",4)));
  long id=ok(req("admin","POST",path,body),200).path("id").asLong();
  var detail=ok(req("admin","GET",path+"/"+id,null),200);var invoice=detail.path("invoice");String version=detail.path("version").asText();
  assertThat(invoice.path("invoiceDate").asText()).isEqualTo("2026-09-13");assertThat(invoice.path("deliveryDate").asText()).isEqualTo("2026-09-12");assertThat(invoice.path("deliveryTime").asText()).isEqualTo("22:15:00");assertThat(invoice.path("dueDate").asText()).isEqualTo("2026-10-13");assertThat(invoice.path("driverName").asText()).isEqualTo("Test Driver");assertThat(invoice.path("driverNumber").asText()).isEqualTo("DRV-007");assertThat(invoice.path("routeId").asText()).isEqualTo("ROUTE-9");assertThat(invoice.path("termsNet").asText()).isEqualTo("Net 30");assertThat(invoice.path("notes").asText()).isEqualTo("Leave invoice with manager");assertThat(invoice.path("otherCharges").asDouble()).isEqualTo(6.25);assertThat(invoice.path("total").asDouble()).isEqualTo(60.25);
  assertThat(db.queryForObject("SELECT total_amount FROM invoice_charges WHERE invoice_id=? AND charge_type='GROCERY'",java.math.BigDecimal.class,id)).isEqualByComparingTo("60.25");
  body.put("freight",6.5);body.put("notes","Updated note");ok(call("admin","PUT",path+"/"+id,body,version,null),200);ok(call("admin","PUT",path+"/"+id,body,version,null),409);
  detail=ok(req("admin","GET",path+"/"+id,null),200);version=detail.path("version").asText();assertThat(detail.path("invoice").path("total").asDouble()).isEqualTo(61.25);
  for(var invalid:List.of(Map.entry("discount",1000),Map.entry("fuelSurcharge",-1),Map.entry("handlingFee",1.001),Map.entry("dueDate","2026-09-01"),Map.entry("driverName","x".repeat(201)))){Object previous=body.put(invalid.getKey(),invalid.getValue());ok(call("admin","PUT",path+"/"+id,body,version,null),400);body.put(invalid.getKey(),previous);}
  body.put("deliveryDate",null);ok(call("admin","PUT",path+"/"+id,body,version,null),400);body.put("deliveryTime",null);body.put("routeId",null);ok(call("admin","PUT",path+"/"+id,body,version,null),200);
  detail=ok(req("admin","GET",path+"/"+id,null),200);assertThat(detail.path("invoice").path("deliveryDate").asText()).isEmpty();assertThat(detail.path("invoice").path("routeId").asText()).isEmpty();assertThat(detail.path("invoice").path("notes").asText()).isEqualTo("Updated note");
  assertThat(db.queryForObject("SELECT count(*) FROM invoice_charges WHERE invoice_id=?",Integer.class,id)).isEqualTo(1);
  assertThat(db.queryForObject("SELECT COALESCE(sum(available_quantity),0) FROM inventory WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,pid)).isEqualByComparingTo(before);
  ok(req("other","GET",path+"/"+id,null),403);ok(req("admin","GET","/access/stores/"+second+"/invoice-entry/"+id,null),404);
  ok(req("admin","POST",path+"/"+id+"/approve",null),200);ok(req("admin","POST",path+"/"+id+"/approve",null),200);
  assertThat(db.queryForObject("SELECT s.status_name FROM invoice_charges c JOIN status_types s ON s.status_type_id=c.status_id WHERE c.invoice_id=?",String.class,id)).isEqualTo("APPROVED");
  assertThat(db.queryForObject("SELECT payment_status FROM invoice_charges WHERE invoice_id=?",String.class,id)).isEqualTo("UNPAID");
  assertThat(db.queryForObject("SELECT available_quantity FROM inventory WHERE dgt_id=? AND product_id=?",java.math.BigDecimal.class,store,pid)).isEqualByComparingTo(before.add(new java.math.BigDecimal("2")));
  ok(call("admin","PUT",path+"/"+id,body,detail.path("version").asText(),null),409);
 }

 @Test @Order(103) void grocerySettingsAreScopedVersionedAndAudited() throws Exception {
  String path=access()+"/grocery-settings";
  var initial=ok(req("admin","GET",path,null),200);assertThat(initial.path("settings").isNull()).isTrue();assertThat(initial.path("version").asText()).isEqualTo("0");
  ok(req("manager","GET",path,null),403);ok(req("other","GET",path,null),403);
  var prefs=new LinkedHashMap<String,Object>();prefs.put("defaultTaxType","non_taxable");prefs.put("overrideCategory",true);prefs.put("overrideItem",true);prefs.put("taxRounding","standard");prefs.put("ebtExempt",true);prefs.put("wicExempt",true);prefs.put("expiryTracking",true);prefs.put("alertDays",10);prefs.put("expiredHandling","warning");prefs.put("dashboardNotif",true);prefs.put("emailNotif",false);prefs.put("inAppNotif",true);prefs.put("reorderRule","fixed");prefs.put("leadTime",3);prefs.put("safetyStock",12.5);prefs.put("itemOverride",true);
  var margin=initial.path("margins").get(0);assertThat(margin).isNotNull();String key=margin.path("key").asText();
  var payload=new LinkedHashMap<String,Object>();payload.put("settings",prefs);payload.put("margins",List.of(Map.of("key",key,"version",margin.path("version").asText(),"margin",32.5)));
  var prices=db.queryForList("SELECT product_id,retail_price FROM product_store_prices WHERE dgt_id=? ORDER BY product_id",store);
  ok(call("admin","PUT",path,payload,"0",null),200);ok(call("admin","PUT",path,payload,"0",null),409);
  var saved=ok(req("admin","GET",path,null),200);assertThat(saved.path("settings").path("alertDays").asInt()).isEqualTo(10);assertThat(saved.path("audit").size()).isEqualTo(1);
  var defaults=ok(req("admin","GET",path+"/defaults",null),200);assertThat(defaults.path("defaultTaxType").asText()).isEqualTo("non_taxable");
  assertThat(db.queryForObject("SELECT default_margin_percentage FROM store_sub_departments WHERE store_sub_department_id=?",java.math.BigDecimal.class,Long.parseLong(key))).isEqualByComparingTo("32.5");
  assertThat(db.queryForList("SELECT product_id,retail_price FROM product_store_prices WHERE dgt_id=? ORDER BY product_id",store)).isEqualTo(prices);
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/grocery-settings",null),200).path("settings").isNull()).isTrue();
  ok(req("other","GET",path+"/defaults",null),403);
  String version=saved.path("version").asText();payload.put("margins",List.of());
  for(var invalid:List.of(Map.entry("alertDays",-1),Map.entry("leadTime",1.5),Map.entry("safetyStock",1001),Map.entry("taxRounding","made_up"),Map.entry("overrideItem","true"))){Object old=prefs.put(invalid.getKey(),invalid.getValue());ok(call("admin","PUT",path,payload,version,null),400);prefs.put(invalid.getKey(),old);}
  prefs.put("alertDays",11);payload.put("margins",List.of(Map.of("key",key,"version",margin.path("version").asText(),"margin",33)));
  ok(call("admin","PUT",path,payload,version,null),409);assertThat(ok(req("admin","GET",path,null),200).path("settings").path("alertDays").asInt()).isEqualTo(10);
  var secondMargins=ok(req("admin","GET","/access/stores/"+second+"/grocery-settings",null),200).path("margins");
  if(!secondMargins.isEmpty()){var wrong=secondMargins.get(0);payload.put("margins",List.of(Map.of("key",wrong.path("key").asText(),"version",wrong.path("version").asText(),"margin",33)));ok(call("admin","PUT",path,payload,version,null),400);}
  payload.put("margins",List.of());
  for(String role:List.of("MANAGER","CASHIER"))db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) SELECT ?,role_type_id,'GROCERY_SETTINGS',true FROM role_types WHERE role_type_name=?",store,role);
  ok(call("cashier","PUT",path,payload,version,null),403);ok(call("manager","PUT",path,payload,version,null),200);
  assertThat(ok(req("admin","GET",path,null),200).path("settings").path("alertDays").asInt()).isEqualTo(11);
  var current=ok(req("admin","GET",path,null),200);var currentMargin=current.path("margins").get(0);var clear=new LinkedHashMap<String,Object>();clear.put("key",key);clear.put("version",currentMargin.path("version").asText());clear.put("margin",null);
  ok(req("admin","PUT",path,Map.of("margins",List.of(clear))),200);
  assertThat(db.queryForObject("SELECT default_margin_percentage FROM store_sub_departments WHERE store_sub_department_id=?",java.math.BigDecimal.class,Long.parseLong(key))).isNull();
 }

 @Test @Order(104) void gasSettingsAndTankHistory() throws Exception {
  String path=access()+"/gas-settings",otherPath="/access/stores/"+second+"/gas-settings";
  var initial=ok(req("admin","GET",path,null),200);assertThat(initial.path("settings").isNull()).isTrue();ok(req("manager","GET",path,null),403);ok(req("other","GET",path,null),403);
  var grade=Map.of("name","GAS TEST "+tag,"type","Gasoline","octane",87);
  var grades=ok(req("admin","POST",path+"/grades",grade),200);ok(req("admin","POST",path+"/grades",grade),200);String gradeId=null;for(var g:grades)if(g.path("name").asText().equals("GAS TEST "+tag))gradeId=g.path("id").asText();assertThat(gradeId).isNotNull();
  ok(req("admin","POST",path+"/grades",Map.of("name","GAS TEST "+tag,"type","Gasoline","octane",89)),409);
  var prefs=new LinkedHashMap<String,Object>();for(String key:List.of("sells_diesel","two_blended_grades","auto_flag_variance","variance_approval_required","low_tank_dashboard","low_tank_email","high_variance_dashboard","high_variance_email","repeated_loss_dashboard","repeated_loss_email","missing_reading_dashboard","missing_reading_email","lock_critical_after_delivery"))prefs.put(key,false);
  prefs.put("plus_tank_type","blended");prefs.put("blend_regular_percentage",50);prefs.put("federal_multiplier",0.01);prefs.put("federal_tolerance_gallons",130);prefs.put("state_multiplier",0.01);prefs.put("state_tolerance_gallons",130);prefs.put("report_state","New York");prefs.put("supplier_payment_method","ach");prefs.put("gas_brand_type","unbranded");prefs.put("card_settlement_method","direct");prefs.put("allowed_variance_percentage",2);prefs.put("daily_loss_threshold_gallons",50);
  var tank=new LinkedHashMap<String,Object>();tank.put("number","T-01");tank.put("name","Test tank");tank.put("gradeId",gradeId);tank.put("capacity",10000);tank.put("safeFill",11000);tank.put("lowLevel",15);tank.put("prepaidTax",0.1);tank.put("taxRate",0.2);tank.put("ustFees",0.01);tank.put("posMapping","POS-1");
  var body=Map.of("settings",prefs,"tanks",List.of(tank));ok(call("admin","PUT",path,body,"0",null),400);assertThat(ok(req("admin","GET",path,null),200).path("settings").isNull()).isTrue();
  tank.put("safeFill",9000);ok(call("admin","PUT",path,body,"0",null),200);ok(call("admin","PUT",path,body,"0",null),409);
  var saved=ok(req("admin","GET",path,null),200);var t=saved.path("tanks").get(0);String id=t.path("id").asText(),version=saved.path("version").asText();tank.put("id",id);tank.put("version",t.path("version").asText());assertThat(t.path("capacityLocked").asBoolean()).isTrue();assertThat(t.path("gradeLocked").asBoolean()).isTrue();assertThat(t.path("taxRate").asDouble()).isEqualTo(0.2);
  assertThat(ok(req("admin","GET",otherPath,null),200).path("tanks").isEmpty()).isTrue();ok(call("admin","PUT",otherPath,body,"0",null),400);
  tank.put("capacity",12000);ok(call("admin","PUT",path,body,version,null),409);tank.put("capacity",10000);
  prefs.put("allowed_variance_percentage",101);ok(call("admin","PUT",path,body,version,null),400);prefs.put("allowed_variance_percentage",2);
  tank.put("version","0");prefs.put("daily_loss_threshold_gallons",60);ok(call("admin","PUT",path,body,version,null),409);assertThat(ok(req("admin","GET",path,null),200).path("settings").path("daily_loss_threshold_gallons").asDouble()).isEqualTo(50);tank.put("version",t.path("version").asText());
  db.update("INSERT INTO fuel_tank_readings(tank_id,reading_datetime,volume_gallons,created_by) VALUES (?,CURRENT_TIMESTAMP,100,?)",Long.parseLong(id),users.get("admin"));tank.put("safeFill",9500);ok(call("admin","PUT",path,body,version,null),409);tank.put("safeFill",9000);
  for(String role:List.of("MANAGER","CASHIER"))db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) SELECT ?,role_type_id,'GAS_SETTINGS',true FROM role_types WHERE role_type_name=?",store,role);
  ok(call("cashier","PUT",path,body,version,null),403);tank.put("name","Updated tank");ok(call("manager","PUT",path,body,version,null),200);
  assertThat(db.queryForObject("SELECT count(*) FROM fuel_tank_grade_assignments WHERE tank_id=?",Integer.class,Long.parseLong(id))).isEqualTo(1);
  var history=ok(req("admin","GET",path+"/audit",null),200);assertThat(history.toString()).contains("Updated tank");ok(req("other","GET",path+"/audit",null),403);
  var siblingTank=new LinkedHashMap<>(tank);siblingTank.remove("id");siblingTank.remove("version");ok(call("admin","PUT",otherPath,Map.of("settings",prefs,"tanks",List.of(siblingTank)),"0",null),200);
  assertThat(ok(req("admin","GET",otherPath,null),200).path("tanks").get(0).path("id").asText()).isNotEqualTo(id);
 }

 @Test @Order(105) void gasDeliveryDraftReceiptAndManualPriceProtection() throws Exception {
  String path=access()+"/gas-deliveries";
  ok(req("other","GET",path,null),403);ok(req("cashier","GET",path,null),403);
  var options=ok(req("admin","GET",path+"/options",null),200);
  String tank=options.path("tanks").get(0).path("id").asText();
  String grade=options.path("tanks").get(0).path("assignments").get(0).path("gradeId").asText();
  String otherTank=db.queryForObject("SELECT tank_id::text FROM fuel_tanks WHERE dgt_id=? LIMIT 1",String.class,second);
  long vendor=db.queryForObject("INSERT INTO vendors(dgt_id,vendor_name) VALUES (?,?) RETURNING vendor_id",Long.class,store,"Gas supplier "+tag);
  long foreignVendor=db.queryForObject("INSERT INTO vendors(dgt_id,vendor_name) VALUES (?,?) RETURNING vendor_id",Long.class,second,"Gas supplier "+tag);
  String date=db.queryForObject("SELECT (CURRENT_TIMESTAMP AT TIME ZONE timezone)::date::text FROM stores WHERE dgt_id=?",String.class,store);
  var header=new LinkedHashMap<String,Object>();header.put("bolNumber","BOL-"+tag);header.put("folio","F-12");header.put("loadDate",date);header.put("loadTime","06:30");header.put("terminal","Test terminal");header.put("supplier",Long.toString(vendor));header.put("customer","Account 12");header.put("destination","Store address");header.put("carrier","Test carrier");header.put("driver","Test driver");header.put("tractor","T-7");header.put("trailer","R-8");header.put("notes","No pricing on BOL");
  var line=new LinkedHashMap<String,Object>();line.put("tank",tank);line.put("gradeId",grade);line.put("productCode","REG87");line.put("description","Regular gasoline");line.put("octane",87);line.put("grossGallons",100);line.put("netGallons",99.125);line.put("temperature",61.5);line.put("gravity",57.25);line.put("meter","M1");line.put("compartment","C1");
  var in=new LinkedHashMap<String,Object>();in.put("header",header);in.put("lines",List.of(line));in.put("receive",false);
  long productMovementCount=db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=? AND product_id IS NOT NULL",Long.class,store);
  long readingCount=db.queryForObject("SELECT count(*) FROM fuel_tank_readings WHERE tank_id=?",Long.class,Long.parseLong(tank));
  long priceId=db.queryForObject("INSERT INTO fuel_prices(dgt_id,fuel_grade_id,cash_price,credit_price,effective_from,changed_by) VALUES (?,?,3.199,3.299,CURRENT_TIMESTAMP,?) RETURNING fuel_price_id",Long.class,store,Long.parseLong(grade),users.get("admin"));
  String prices=db.queryForList("SELECT * FROM fuel_prices WHERE fuel_price_id=?",priceId).toString();
  line.put("tank",otherTank);ok(req("admin","POST",path,in),400);line.put("tank",tank);
  header.put("supplier",Long.toString(foreignVendor));ok(req("admin","POST",path,in),400);header.put("supplier",Long.toString(vendor));
  line.put("gradeId","999999999");ok(req("admin","POST",path,in),409);line.put("gradeId",grade);
  line.put("grossGallons",0);ok(req("admin","POST",path,in),400);line.put("grossGallons",100);
  line.put("netGallons",99.12345);ok(req("admin","POST",path,in),400);line.put("netGallons",99.125);
  String key=UUID.randomUUID().toString();var draft=ok(call("admin","POST",path,in,null,key),200);String id=draft.path("id").asText(),v1=draft.path("version").asText();
  assertThat(draft.path("header").path("driver").asText()).isEqualTo("Test driver");assertThat(draft.path("lines").get(0).path("netGallons").asDouble()).isEqualTo(99.125);
  assertThat(ok(call("admin","POST",path,in,null,key),200).path("id").asText()).isEqualTo(id);
  ok(req("admin","POST",path,in),409);
  header.put("notes","Edited note");ok(call("admin","POST",path,in,null,key),409);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=? AND fuel_delivery_line_id IS NOT NULL",Integer.class,store)).isZero();
  ok(req("admin","GET","/access/stores/"+second+"/gas-deliveries/"+id,null),404);
  long cashierRole=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER'",Long.class);
  db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) VALUES (?,?,'GAS_RECORD_DELIVERY',true)",store,cashierRole);
  assertThat(ok(req("cashier","GET",path,null),200).path("canReceive").asBoolean()).isFalse();
  ok(call("cashier","POST",path+"/"+id+"/receive",null,v1,null),403);
  in.put("receive",true);ok(call("cashier","PUT",path+"/"+id,in,v1,null),403);in.put("receive",false);
  line.put("compartment","C2");var draft2=ok(call("cashier","PUT",path+"/"+id,in,v1,null),200);String v2=draft2.path("version").asText();
  ok(call("admin","PUT",path+"/"+id,in,v1,null),409);ok(call("admin","POST",path+"/"+id+"/receive",null,v1,null),409);
  long managerRole=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) VALUES (?,?,'GAS_RECEIVE_DELIVERY',true)",store,managerRole);
  var concurrent=new ArrayList<java.util.concurrent.CompletableFuture<Response>>();for(int n=0;n<2;n++)concurrent.add(java.util.concurrent.CompletableFuture.supplyAsync(()->{try{return call("manager","POST",path+"/"+id+"/receive",null,v2,null);}catch(Exception e){throw new RuntimeException(e);}}));
  for(var result:concurrent)assertThat(ok(result.get(),200).path("status").asText()).isEqualTo("RECEIVED");
  ok(call("admin","PUT",path+"/"+id,in,v2,null),409);
  var movement=db.queryForMap("SELECT * FROM inventory_movements WHERE dgt_id=? AND fuel_delivery_line_id IS NOT NULL",store);
  assertThat(movement.get("movement_type")).isEqualTo("FUEL_DELIVERY");assertThat(movement.get("unit_cost")).isNull();assertThat(movement.get("product_id")).isNull();assertThat(((Number)movement.get("qty_changed")).doubleValue()).isEqualTo(100);assertThat(((Number)movement.get("net_gallons")).doubleValue()).isEqualTo(99.125);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=? AND product_id IS NOT NULL",Long.class,store)).isEqualTo(productMovementCount);
  assertThat(db.queryForObject("SELECT count(*) FROM fuel_tank_readings WHERE tank_id=?",Long.class,Long.parseLong(tank))).isEqualTo(readingCount);
  assertThat(db.queryForList("SELECT * FROM fuel_prices WHERE fuel_price_id=?",priceId).toString()).isEqualTo(prices);
  assertThat(db.queryForObject("SELECT count(*) FROM access_audit_events WHERE dgt_id=? AND event_type='GAS_DELIVERY_RECEIVED' AND target_id=?",Integer.class,store,id)).isEqualTo(1);
  header.put("bolNumber","FUTURE-"+tag);header.put("loadDate",java.time.LocalDate.parse(date).plusDays(1).toString());in.put("receive",true);ok(req("admin","POST",path,in),400);
  assertThat(db.queryForObject("SELECT count(*) FROM fuel_deliveries WHERE dgt_id=? AND bol_number=?",Integer.class,store,"FUTURE-"+tag)).isZero();
  // Multi-compartment delivery posts a separate movement per line, with no price update.
  header.put("loadDate",date);header.put("loadTime",null);header.put("bolNumber","MULTI-"+tag);in.put("lines",List.of(line,line));var received=ok(req("admin","POST",path,in),200);
  assertThat(received.path("status").asText()).isEqualTo("RECEIVED");assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=? AND reference_id=? AND movement_type='FUEL_DELIVERY'",Integer.class,store,received.path("id").asLong())).isEqualTo(2);
  assertThat(db.queryForList("SELECT * FROM fuel_prices WHERE fuel_price_id=?",priceId).toString()).isEqualTo(prices);
 }

 @Test @Order(106) void manualGasPricesPreserveHistoryAndStoreIsolation() throws Exception {
  String path=access()+"/gas-prices";
  ok(req("other","GET",path,null),403);ok(req("cashier","GET",path,null),403);ok(req("accountant","GET",path,null),403);
  var initial=ok(req("manager","GET",path,null),200);var current=initial.path("history").get(0);String grade=current.path("gradeId").asText();
  assertThat(current.path("current").asBoolean()).isTrue();String version=current.path("id").asText()+":"+current.path("version").asText();
  var in=new LinkedHashMap<String,Object>();in.put("gradeId",grade);in.put("cash",3.499);in.put("credit",3.599);in.put("reason","market");in.put("notes","Manual test change");in.put("effectiveTime","now");
  long movements=db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Long.class,store);
  in.put("cash",0);ok(call("admin","POST",path,in,version,null),400);in.put("cash",3.4999);ok(call("admin","POST",path,in,version,null),400);in.put("cash",3.499);
  in.put("effectiveTime","scheduled");ok(call("admin","POST",path,in,version,null),400);in.put("effectiveTime","now");
  ok(call("cashier","POST",path,in,version,null),403);ok(call("admin","POST",path,in,"0",null),409);
  String key=UUID.randomUUID().toString();var saved=ok(call("manager","POST",path,in,version,key),200);var latest=saved.path("history").get(0);
  assertThat(latest.path("current").asBoolean()).isTrue();assertThat(latest.path("cash").asDouble()).isEqualTo(3.499);assertThat(latest.path("credit").asDouble()).isEqualTo(3.599);assertThat(latest.path("oldCash").asDouble()).isEqualTo(3.199);assertThat(latest.path("reason").asText()).isEqualTo("market");assertThat(latest.path("notes").asText()).isEqualTo("Manual test change");assertThat(latest.path("source").asText()).isEqualTo("Manual");assertThat(latest.path("actor").asText()).contains("manager");
  assertThat(saved.path("history").get(1).path("effectiveTo").asText()).isEqualTo(latest.path("effectiveFrom").asText());
  int count=saved.path("history").size();assertThat(ok(call("manager","POST",path,in,version,key),200).path("history").size()).isEqualTo(count);
  String next=latest.path("id").asText()+":"+latest.path("version").asText();assertThat(ok(call("manager","POST",path,in,next,null),200).path("history").size()).isEqualTo(count);
  in.put("cash",3.599);ok(call("manager","POST",path,in,version,key),409);ok(call("manager","POST",path,in,version,null),409);
  var separate=ok(call("admin","POST","/access/stores/"+second+"/gas-prices",in,"0",null),200);assertThat(separate.path("history").get(0).path("cash").asDouble()).isEqualTo(3.599);
  assertThat(ok(req("admin","GET",path,null),200).path("history").get(0).path("cash").asDouble()).isEqualTo(3.499);
  long overlap=db.queryForObject("INSERT INTO fuel_prices(dgt_id,fuel_grade_id,cash_price,credit_price,effective_from,changed_by) VALUES (?,?,4,4,CURRENT_TIMESTAMP,?) RETURNING fuel_price_id",Long.class,store,Long.parseLong(grade),users.get("admin"));
  ok(call("admin","POST",path,in,next,null),409);db.update("DELETE FROM fuel_prices WHERE fuel_price_id=?",overlap);
  var otherInput=new LinkedHashMap<String,Object>(in);otherInput.put("cash",3.699);
  var one=java.util.concurrent.CompletableFuture.supplyAsync(()->{try{return call("admin","POST",path,in,next,null);}catch(Exception e){throw new RuntimeException(e);}});
  var two=java.util.concurrent.CompletableFuture.supplyAsync(()->{try{return call("manager","POST",path,otherInput,next,null);}catch(Exception e){throw new RuntimeException(e);}});
  assertThat(List.of(one.get().code(),two.get().code())).containsExactlyInAnyOrder(200,409);
  assertThat(db.queryForObject("SELECT count(*) FROM fuel_prices WHERE dgt_id=? AND fuel_grade_id=? AND effective_to IS NULL",Integer.class,store,Long.parseLong(grade))).isEqualTo(1);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Long.class,store)).isEqualTo(movements);
 }

 @Test @Order(107) void scheduledGasPricesActivateAndCancelWithoutPos() throws Exception {
  String path=access()+"/gas-prices";
  java.util.function.Function<JsonNode,JsonNode> active=n->java.util.stream.StreamSupport.stream(n.path("history").spliterator(),false).filter(r->r.path("current").asBoolean()).findFirst().orElseThrow();
  java.util.function.Function<JsonNode,String> version=n->n.path("id").asText()+":"+n.path("version").asText();
  var baseline=active.apply(ok(req("admin","GET",path,null),200));String grade=baseline.path("gradeId").asText();
  db.update("UPDATE stores SET timezone='America/New_York' WHERE dgt_id=?",store);
  var in=new LinkedHashMap<String,Object>();in.put("gradeId",grade);in.put("cash",4.799);in.put("credit",4.899);in.put("reason","market");in.put("notes","Scheduled test");in.put("effectiveTime","scheduled");
  in.put("scheduledFor","2027-03-14T02:30:00");ok(call("admin","POST",path,in,version.apply(baseline),null),400);
  in.put("scheduledFor","2026-11-01T01:30:00");ok(call("admin","POST",path,in,version.apply(baseline),null),400);
  in.put("overlapChoice","later");String key=UUID.randomUUID().toString();var scheduled=ok(call("admin","POST",path,in,version.apply(baseline),key),200);var future=scheduled.path("history").get(0);
  assertThat(future.path("status").asText()).isEqualTo("SCHEDULED");assertThat(java.time.OffsetDateTime.parse(future.path("effectiveFrom").asText()).toInstant()).isEqualTo(java.time.Instant.parse("2026-11-01T06:30:00Z"));
  assertThat(active.apply(scheduled).path("cash").asDouble()).isEqualTo(baseline.path("cash").asDouble());
  assertThat(ok(call("admin","POST",path,in,version.apply(baseline),key),200).path("history").size()).isEqualTo(scheduled.path("history").size());
  ok(call("admin","POST",path,in,version.apply(active.apply(scheduled)),null),409);
  var immediate=new LinkedHashMap<String,Object>(in);immediate.put("effectiveTime","now");immediate.put("scheduledFor",null);immediate.put("overlapChoice",null);immediate.put("cash",4.199);immediate.put("credit",4.299);
  var interim=ok(call("manager","POST",path,immediate,version.apply(active.apply(scheduled)),null),200);assertThat(active.apply(interim).path("effectiveTo").asText()).isEqualTo(future.path("effectiveFrom").asText());
  String cancel=path+"/"+future.path("id").asText()+"/cancel";
  ok(call("cashier","POST",cancel,null,version.apply(future),null),403);ok(call("admin","POST","/access/stores/"+second+"/gas-prices/"+future.path("id").asText()+"/cancel",null,version.apply(future),null),404);ok(call("admin","POST",cancel,null,"stale",null),409);
  var cancelled=ok(call("admin","POST",cancel,null,version.apply(future),null),200);assertThat(cancelled.path("history").get(0).path("status").asText()).isEqualTo("CANCELLED");assertThat(active.apply(cancelled).path("cash").asDouble()).isEqualTo(4.199);assertThat(active.apply(cancelled).path("effectiveTo").isNull()).isTrue();
  ok(call("admin","POST",cancel,null,version.apply(future),null),200);
  in.put("overlapChoice",null);in.put("scheduledFor",java.time.LocalDateTime.now(java.time.ZoneId.of("America/New_York")).minusMinutes(1).withNano(0).toString());ok(call("admin","POST",path,in,version.apply(active.apply(cancelled)),null),400);
  var when=java.time.LocalDateTime.now(java.time.ZoneId.of("America/New_York")).plusSeconds(6).withNano(0);in.put("scheduledFor",when.toString());var soon=ok(call("admin","POST",path,in,version.apply(active.apply(cancelled)),null),200);
  var next=java.util.stream.StreamSupport.stream(soon.path("history").spliterator(),false).filter(r->r.path("status").asText().equals("SCHEDULED")).findFirst().orElseThrow();
  assertThat(active.apply(soon).path("cash").asDouble()).isEqualTo(4.199);
  long wait=java.time.Duration.between(java.time.Instant.now(),when.atZone(java.time.ZoneId.of("America/New_York")).toInstant()).toMillis()+300;if(wait>0)Thread.sleep(wait);
  var after=ok(req("admin","GET",path,null),200);assertThat(active.apply(after).path("id").asText()).isEqualTo(next.path("id").asText());assertThat(active.apply(after).path("cash").asDouble()).isEqualTo(4.799);assertThat(active.apply(after).path("oldCash").asDouble()).isEqualTo(4.199);
  ok(call("admin","POST",path+"/"+next.path("id").asText()+"/cancel",null,version.apply(next),null),409);
  assertThat(db.queryForObject("SELECT count(*) FROM fuel_prices WHERE dgt_id=? AND fuel_grade_id=? AND effective_from<=CURRENT_TIMESTAMP AND (effective_to IS NULL OR effective_to>CURRENT_TIMESTAMP)",Integer.class,store,Long.parseLong(grade))).isEqualTo(1);
  var cancelledHistory=java.util.stream.StreamSupport.stream(after.path("history").spliterator(),false).filter(r->r.path("id").asText().equals(future.path("id").asText())).findFirst().orElseThrow();assertThat(cancelledHistory.path("oldCash").asDouble()).isEqualTo(baseline.path("cash").asDouble());
  db.update("UPDATE stores SET timezone='Asia/Kolkata' WHERE dgt_id=?",store);
 }

 @Test @Order(108) void gasAdjustmentsGallonsApprovalAndIsolation() throws Exception {
  String path=access()+"/gas-adjustments";
  long grade=db.queryForObject("SELECT fuel_grade_id FROM fuel_grades WHERE grade_name=?",Long.class,"GAS TEST "+tag);
  long tank=db.queryForObject("INSERT INTO fuel_tanks(dgt_id,tank_number,capacity_gallons,safe_fill_capacity) VALUES (?,'ADJUST-TEST',10000,9000) RETURNING tank_id",Long.class,store);
  db.update("INSERT INTO fuel_tank_grade_assignments(tank_id,fuel_grade_id,effective_from) VALUES (?,?,'2020-01-01')",tank,grade);
  var data=ok(req("admin","GET",path,null),200);
  ok(req("other","GET",path,null),403);ok(req("cashier","GET",path,null),403);
  for(String who:List.of("manager","cashier"))for(String code:List.of("GAS_VIEW_ADJUSTMENTS","GAS_RECORD_ADJUSTMENT","GAS_APPROVE_ADJUSTMENT"))db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) SELECT ?,role_type_id,?,true FROM role_types WHERE role_type_name=? ON CONFLICT(dgt_id,role_type_id,permission_code) DO UPDATE SET allowed=true",store,code,who.toUpperCase());
  ok(req("cashier","POST",path+"/tanks/"+tank+"/initial-reading",Map.of("gallons",1000)),403);
  ok(req("admin","POST",path+"/tanks/"+tank+"/initial-reading",Map.of("gallons",10001)),400);
  ok(req("admin","POST",path+"/tanks/"+tank+"/initial-reading",Map.of("gallons",1000)),200);
  ok(req("admin","POST",path+"/tanks/"+tank+"/initial-reading",Map.of("gallons",1000)),409);
  java.util.function.Supplier<JsonNode> current=()->{try{return java.util.stream.StreamSupport.stream(ok(req("admin","GET",path,null),200).path("tanks").spliterator(),false).filter(tankRow->tankRow.path("id").asText().equals(Long.toString(tank))).findFirst().orElseThrow();}catch(Exception e){throw new RuntimeException(e);}};
  var t=current.get();var line=new LinkedHashMap<String,Object>();line.put("tankId",tank);line.put("gradeId",grade);line.put("systemGallons",1000);line.put("actualGallons",950);line.put("readingId",t.path("readingId").asText());line.put("movementId",null);line.put("reason","calibration");
  var in=new LinkedHashMap<String,Object>();in.put("date",data.path("today").asText());in.put("notes","Test gallons only");in.put("lines",List.of(line));in.put("submit",false);
  long before=db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Long.class,store);
  String key=UUID.randomUUID().toString();var draft=ok(call("cashier","POST",path,in,null,key),200);String id=draft.path("id").asText();assertThat(draft.path("status").asText()).isEqualTo("DRAFT");assertThat(ok(call("cashier","POST",path,in,null,key),200).path("id").asText()).isEqualTo(id);
  in.put("submit",true);ok(call("cashier","POST",path,in,null,key),409);
  var pending=ok(call("cashier","PUT",path+"/"+id,in,draft.path("version").asText(),null),200);assertThat(pending.path("status").asText()).isEqualTo("PENDING");assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Long.class,store)).isEqualTo(before);
  ok(call("cashier","POST",path+"/"+id+"/approve",null,pending.path("version").asText(),null),403);
  ok(call("manager","POST",path+"/"+id+"/approve",null,"0",null),409);
  var approved=ok(call("manager","POST",path+"/"+id+"/approve",null,pending.path("version").asText(),null),200);assertThat(approved.path("status").asText()).isEqualTo("POSTED");ok(call("manager","POST",path+"/"+id+"/approve",null,pending.path("version").asText(),null),200);
  assertThat(current.get().path("systemGallons").asDouble()).isEqualTo(950);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Long.class,store)).isEqualTo(before+1);
  assertThat(db.queryForObject("SELECT qty_changed FROM inventory_movements WHERE fuel_adjustment_line_id=?",java.math.BigDecimal.class,approved.path("lines").get(0).path("id").asLong())).isEqualByComparingTo("-50");
  ok(call("admin","PUT",path+"/"+id,in,approved.path("version").asText(),null),409);
  ok(call("admin","POST","/access/stores/"+second+"/gas-adjustments/"+id+"/approve",null,approved.path("version").asText(),null),404);
  ok(req("admin","POST",path,in),409); // old baseline
  t=current.get();line.put("systemGallons",950);line.put("movementId",t.path("movementId").asText());line.put("actualGallons",0);
  var own=ok(req("manager","POST",path,in),200);ok(call("manager","POST",path+"/"+own.path("id").asText()+"/approve",null,own.path("version").asText(),null),403);
  ok(call("admin","POST",path+"/"+own.path("id").asText()+"/reject",Map.of("reason",""),own.path("version").asText(),null),400);
  var rejected=ok(call("admin","POST",path+"/"+own.path("id").asText()+"/reject",Map.of("reason","Verify measurement"),own.path("version").asText(),null),200);assertThat(rejected.path("status").asText()).isEqualTo("REJECTED");assertThat(current.get().path("systemGallons").asDouble()).isEqualTo(950);
  var auto=ok(req("admin","POST",path,in),200);assertThat(auto.path("status").asText()).isEqualTo("POSTED");assertThat(current.get().path("systemGallons").asDouble()).isZero();

  t=current.get();line.put("systemGallons",0);line.put("movementId",t.path("movementId").asText());line.put("actualGallons",25);
  var stalePending=ok(req("cashier","POST",path,in),200);
  line.put("actualGallons",10);ok(req("admin","POST",path,in),200);
  ok(call("manager","POST",path+"/"+stalePending.path("id").asText()+"/approve",null,stalePending.path("version").asText(),null),409);
  assertThat(current.get().path("systemGallons").asDouble()).isEqualTo(10);
  t=current.get();line.put("systemGallons",10);line.put("movementId",t.path("movementId").asText());line.put("actualGallons",20);
  var concurrent=ok(req("cashier","POST",path,in),200);String approvePath=path+"/"+concurrent.path("id").asText()+"/approve",v=concurrent.path("version").asText();
  var one=java.util.concurrent.CompletableFuture.supplyAsync(()->{try{return call("manager","POST",approvePath,null,v,null);}catch(Exception e){throw new RuntimeException(e);}});
  var two=java.util.concurrent.CompletableFuture.supplyAsync(()->{try{return call("admin","POST",approvePath,null,v,null);}catch(Exception e){throw new RuntimeException(e);}});
  ok(one.get(),200);ok(two.get(),200);assertThat(current.get().path("systemGallons").asDouble()).isEqualTo(20);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE fuel_adjustment_line_id=?",Integer.class,concurrent.path("lines").get(0).path("id").asLong())).isEqualTo(1);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=? AND fuel_adjustment_line_id IS NOT NULL AND (unit_cost IS NOT NULL OR product_id IS NOT NULL)",Integer.class,store)).isZero();
 }

 @Test @Order(109) void tankReportUsesReadingsAndMovementsWithStoreLocalDays() throws Exception {
  db.update("UPDATE stores SET timezone='America/New_York' WHERE dgt_id=?",store);
  long grade=db.queryForObject("SELECT fuel_grade_id FROM fuel_grades WHERE grade_name=?",Long.class,"GAS TEST "+tag);
  long tank=db.queryForObject("INSERT INTO fuel_tanks(dgt_id,tank_number,capacity_gallons,safe_fill_capacity) VALUES (?,'REPORT-TEST',10000,9000) RETURNING tank_id",Long.class,store);
  long unknown=db.queryForObject("INSERT INTO fuel_tanks(dgt_id,tank_number,capacity_gallons,safe_fill_capacity) VALUES (?,'REPORT-UNKNOWN',10000,9000) RETURNING tank_id",Long.class,store);
  db.update("UPDATE fuel_tanks SET created_at='2026-03-07 00:00:00-05' WHERE tank_id IN (?,?)",tank,unknown);
  for(long id:List.of(tank,unknown))db.update("INSERT INTO fuel_tank_grade_assignments(tank_id,fuel_grade_id,effective_from) VALUES (?,?,'2020-01-01')",id,grade);
  long baseline=db.queryForObject("INSERT INTO fuel_tank_readings(tank_id,volume_gallons,reading_datetime,created_by) VALUES (?,1000,'2026-03-07 12:00:00-05',?) RETURNING tank_reading_id",Long.class,tank,users.get("admin"));
  db.update("INSERT INTO fuel_tank_readings(tank_id,volume_gallons,reading_datetime,created_by) VALUES (?,1120,'2026-03-08 12:00:00-04',?)",tank,users.get("admin"));
  long vendor=db.queryForObject("SELECT min(vendor_id) FROM vendors WHERE dgt_id=?",Long.class,store);
  long delivery=db.queryForObject("INSERT INTO fuel_deliveries(dgt_id,vendor_id,client_request_id,request_hash,bol_number,load_date,created_by,status,received_by,received_at) VALUES (?,?,?,'test','REPORT-BOL','2026-03-06',?,'RECEIVED',?,'2026-03-08 00:30:00-05') RETURNING delivery_id",Long.class,store,vendor,UUID.randomUUID(),users.get("admin"),users.get("admin"));
  long dl=db.queryForObject("INSERT INTO fuel_delivery_lines(delivery_id,dgt_id,line_number,tank_id,fuel_grade_id,gross_gallons,net_gallons) VALUES (?,?,1,?,?,200,195) RETURNING delivery_line_id",Long.class,delivery,store,tank,grade);
  db.update("INSERT INTO inventory_movements(dgt_id,tank_id,fuel_grade_id,fuel_delivery_line_id,movement_type,qty_changed,net_gallons,unit_cost,created_at) VALUES (?,?,?,?,'FUEL_DELIVERY',200,195,NULL,'2026-03-08 00:30:00-05')",store,tank,grade,dl);
  long adjustment=db.queryForObject("INSERT INTO fuel_adjustments(dgt_id,client_request_id,request_hash,adjustment_date,status,created_by,reviewed_by,reviewed_at) VALUES (?,?,'test','2026-03-08','POSTED',?,?,'2026-03-08 03:30:00-04') RETURNING adjustment_id",Long.class,store,UUID.randomUUID(),users.get("admin"),users.get("admin"));
  long al=db.queryForObject("INSERT INTO fuel_adjustment_lines(adjustment_id,dgt_id,tank_id,fuel_grade_id,system_gallons,actual_gallons,baseline_reading_id,reason) VALUES (?,?,?,?,1200,1170,?,'calibration') RETURNING adjustment_line_id",Long.class,adjustment,store,tank,grade,baseline);
  db.update("INSERT INTO inventory_movements(dgt_id,tank_id,fuel_grade_id,fuel_adjustment_line_id,movement_type,qty_changed,unit_cost,created_at) VALUES (?,?,?,?,'FUEL_ADJUSTMENT',-30,NULL,'2026-03-08 03:30:00-04')",store,tank,grade,al);
  String path=access()+"/gas-tank-report?start=2026-03-08&end=2026-03-09&grade="+grade;
  long movementCount=db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Long.class,store);
  var report=ok(req("admin","GET",path,null),200);
  var selected=java.util.stream.StreamSupport.stream(report.path("rows").spliterator(),false).filter(r->r.path("tankId").asLong()==tank).toList();assertThat(selected).hasSize(2);
  var day=selected.getFirst();assertThat(day.path("open").asDouble()).isEqualTo(1000);assertThat(day.path("purchase").asDouble()).isEqualTo(200);assertThat(day.path("adjustments").asDouble()).isEqualTo(-30);assertThat(day.path("close").asDouble()).isEqualTo(1120);assertThat(day.path("stVol").asDouble()).isEqualTo(1120);assertThat(day.path("sold").isNull()).isTrue();assertThat(day.path("os").isNull()).isTrue();assertThat(day.path("stInches").isNull()).isTrue();
  assertThat(selected.get(1).path("open").asDouble()).isEqualTo(1120);assertThat(selected.get(1).path("purchase").asDouble()).isZero();assertThat(selected.get(1).path("stVol").isNull()).isTrue();
  var sum=java.util.stream.StreamSupport.stream(report.path("summary").spliterator(),false).filter(r->r.path("tankId").asLong()==tank).findFirst().orElseThrow();assertThat(sum.path("purchase").asDouble()).isEqualTo(200);assertThat(sum.path("adjustments").asDouble()).isEqualTo(-30);assertThat(sum.path("close").asDouble()).isEqualTo(1120);
  var missing=java.util.stream.StreamSupport.stream(report.path("rows").spliterator(),false).filter(r->r.path("tankId").asLong()==unknown).findFirst().orElseThrow();assertThat(missing.path("open").isNull()).isTrue();assertThat(missing.path("close").isNull()).isTrue();
  var previous=ok(req("admin","GET",access()+"/gas-tank-report?start=2026-03-07&end=2026-03-07",null),200);assertThat(java.util.stream.StreamSupport.stream(previous.path("rows").spliterator(),false).filter(r->r.path("tankId").asLong()==tank).findFirst().orElseThrow().path("purchase").asDouble()).isZero();
  ok(req("manager","GET",path,null),200);ok(req("other","GET",path,null),403);ok(req("accountant","GET",path,null),403);
  ok(req("admin","GET",access()+"/gas-tank-report?start=2026-03-09&end=2026-03-08",null),400);ok(req("admin","GET",access()+"/gas-tank-report?start=2020-01-01",null),400);ok(req("admin","GET",access()+"/gas-tank-report?end=2999-01-01",null),400);ok(req("admin","GET",access()+"/gas-tank-report?grade=999999999",null),400);
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/gas-tank-report?start=2026-03-08&end=2026-03-09",null),200).toString()).doesNotContain("REPORT-TEST");
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Long.class,store)).isEqualTo(movementCount);
  db.update("UPDATE stores SET timezone='Asia/Kolkata' WHERE dgt_id=?",store);
 }

 @Test @Order(110) void liveActivityStoreIsolationTotalsAndDateFiltering() throws Exception {
  long employee=db.queryForObject("SELECT min(employee_id) FROM employees WHERE user_id=?",Long.class,users.get("cashier"));
  long product=db.queryForObject("SELECT min(product_id) FROM products WHERE dgt_id=?",Long.class,store);
  long terminal=db.queryForObject("INSERT INTO pos_terminals(store_id,terminal_code) VALUES (?,'ACTIVITY') RETURNING terminal_id",Long.class,store);
  long tender=db.queryForObject("SELECT tender_type_id FROM tender_types WHERE tender_code='CASH'",Long.class);
  db.update("UPDATE stores SET timezone='America/New_York' WHERE dgt_id=?",store);
  long sale=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,taxable_amount,tax_amount,discount_amount,total_amount,total_items) VALUES (?,?,?,'LIVE-1',?,'SALE','COMPLETED','2026-05-01 23:59:00-04',9,9,0.54,1,9.54,1) RETURNING sale_id",Long.class,store,employee,terminal,"LIVE-1-"+tag);
  db.update("INSERT INTO sales_items(sale_id,product_id,quantity,catalog_price,unit_price,gross_amount,discount_amount,taxable_amount,tax_amount,line_total) VALUES (?,?,1,10,9,10,1,9,0.54,9.54)",sale,product);
  db.update("INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status,payment_datetime) VALUES (?,?,9.54,'COMPLETED','2026-05-01 23:59:00-04')",sale,tender);
  long refund=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,tax_amount,total_amount,total_items) VALUES (?,?,?,'LIVE-2',?,'REFUND','COMPLETED','2026-05-01 23:59:30-04',-2,0,-2,1) RETURNING sale_id",Long.class,store,employee,terminal,"LIVE-2-"+tag);
  db.update("INSERT INTO sales_items(sale_id,product_id,quantity,unit_price,gross_amount,line_total) VALUES (?,?,-1,2,-2,-2)",refund,product);
  db.update("INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status) VALUES (?,?,-2,'REFUNDED')",refund,tender);
  long voided=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,total_amount) VALUES (?,?,?,'LIVE-3',?,'VOID','VOIDED','2026-05-02 00:01:00-04',100) RETURNING sale_id",Long.class,store,employee,terminal,"LIVE-3-"+tag);
  String path=access()+"/live-activity";var first=ok(req("admin","GET",path+"?start=2026-05-01&end=2026-05-01",null),200);assertThat(first.path("stats").path("transactions").asLong()).isEqualTo(2);assertThat(first.path("stats").path("netSales").asDouble()).isEqualTo(7.54);assertThat(first.path("stats").path("tax").asDouble()).isEqualTo(.54);assertThat(first.path("stats").path("discounts").asDouble()).isEqualTo(1);assertThat(first.path("tenders").get(0).path("amount").asDouble()).isEqualTo(7.54);assertThat(first.path("stats").path("returnCount").asLong()).isEqualTo(1);
  var detail=ok(req("manager","GET",path+"/"+sale,null),200);assertThat(detail.path("items").get(0).path("total").asDouble()).isEqualTo(9.54);assertThat(detail.path("items").get(0).path("tax").asDouble()).isEqualTo(.54);
  var voidDay=ok(req("admin","GET",path+"?start=2026-05-02&end=2026-05-02",null),200);assertThat(voidDay.path("stats").path("netSales").asDouble()).isZero();assertThat(voidDay.path("stats").path("voidCount").asLong()).isEqualTo(1);
  assertThat(ok(req("manager","GET",path+"?start=2026-05-01&end=2026-05-01&type=SALE",null),200).path("stats").path("netSales").asDouble()).isEqualTo(9.54);
  ok(req("cashier","GET",path,null),403);ok(req("accountant","GET",path,null),403);ok(req("other","GET",path+"/"+sale,null),403);ok(req("admin","GET","/access/stores/"+second+"/live-activity/"+sale,null),404);
  ok(req("admin","GET",path+"?terminal=999999999",null),400);ok(req("admin","GET",path+"?type=HACK",null),400);ok(req("admin","GET",path+"?page=0",null),400);ok(req("admin","GET",path+"?start=2026-05-02&end=2026-05-01",null),400);
  var pageOne=ok(req("admin","GET",path+"?start=2026-05-01&end=2026-05-01&size=1",null),200);assertThat(pageOne.path("transactions").size()).isEqualTo(1);assertThat(pageOne.path("stats").path("transactions").asLong()).isEqualTo(2);
  assertThat(first.path("stats").path("gasVolume").asDouble()).isZero();
  long department=db.queryForObject("SELECT sub.store_department_id FROM products p JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id WHERE p.product_id=?",Long.class,product);
  db.update("UPDATE store_departments SET store_department_name='Fuel' WHERE store_department_id=?",department);
  db.update("UPDATE products SET unit_of_measure='Gallon' WHERE product_id=?",product);
  db.update("UPDATE sales_items SET quantity=12.345 WHERE sale_id=?",sale);
  db.update("UPDATE sales_items SET quantity=-2 WHERE sale_id=?",refund);
  db.update("INSERT INTO sales_items(sale_id,product_id,quantity,unit_price,line_total) VALUES (?,?,100,1,100)",voided,product);
  var fuel=ok(req("admin","GET",path+"?start=2026-05-01&end=2026-05-01&size=1&terminal="+terminal,null),200);
  assertThat(fuel.path("stats").path("gasVolume").asDouble()).isEqualTo(10.345);
  assertThat(ok(req("admin","GET",path+"?start=2026-05-01&end=2026-05-01&type=SALE",null),200).path("stats").path("gasVolume").asDouble()).isEqualTo(12.345);
  assertThat(ok(req("admin","GET",path+"?start=2026-05-02&end=2026-05-02",null),200).path("stats").path("gasVolume").asDouble()).isZero();
  db.update("UPDATE products SET unit_of_measure='Each' WHERE product_id=?",product);
  assertThat(ok(req("admin","GET",path+"?start=2026-05-01&end=2026-05-01",null),200).path("stats").path("gasVolume").asDouble()).isZero();
  db.update("UPDATE stores SET timezone='Asia/Kolkata' WHERE dgt_id=?",store);
 }

 @Test @Order(111) void closingCashDraftFreezeAndStoreIsolation() throws Exception {
  db.update("UPDATE stores SET default_opening_cash=100,timezone='America/New_York' WHERE dgt_id=?",store);
  db.update("UPDATE stores SET default_opening_cash=150 WHERE dgt_id=?",second);
  String path=access()+"/daily-closing",day="2026-05-01";
  var metadata=ok(req("admin","GET",path+"/meta",null),200);assertThat(metadata.path("openingDefault").asDouble()).isEqualTo(100);assertThat(metadata.path("latest").asText()).isEqualTo("2026-05-02");
  var initial=ok(req("admin","GET",path+"/"+day,null),200);
  assertThat(initial.path("openingCash").asDouble()).isEqualTo(100);
  assertThat(initial.path("expectedCash").asDouble()).isEqualTo(107.54);
  assertThat(initial.path("actualCash").isNull()).isTrue();
  var payload=new LinkedHashMap<String,Object>();payload.put("version",initial.path("version").asText());payload.put("sourceToken",initial.path("sourceToken").asText());payload.put("openingCash",100);payload.put("cashAdded",10);payload.put("cashDrops",20);payload.put("payouts",5);payload.put("actualCash",90);payload.put("notes","Test cash reconciliation");payload.put("close",false);
  ok(req("cashier","PUT",path+"/"+day,payload),403);ok(req("other","GET",path+"/"+day,null),403);
  var draft=ok(req("manager","PUT",path+"/"+day,payload),200);
  assertThat(draft.path("status").asText()).isEqualTo("DRAFT");assertThat(draft.path("expectedCash").asDouble()).isEqualTo(92.54);assertThat(draft.path("variance").asDouble()).isEqualTo(-2.54);
  ok(req("admin","PUT",path+"/"+day,payload),409);
  payload.put("version",draft.path("version").asText());payload.put("sourceToken",draft.path("sourceToken").asText());payload.put("cashDrops",1000);
  ok(req("admin","PUT",path+"/"+day,payload),400);payload.put("cashDrops",20);
  long sale=db.queryForObject("SELECT sale_id FROM sales WHERE store_id=? AND receipt_no='LIVE-1'",Long.class,store);
  db.update("UPDATE sales SET tax_amount=tax_amount+1,total_amount=total_amount+1 WHERE sale_id=?",sale);
  ok(req("admin","PUT",path+"/"+day,payload),409);
  var refreshed=ok(req("admin","GET",path+"/"+day,null),200);payload.put("sourceToken",refreshed.path("sourceToken").asText());payload.put("close",true);
  var closed=ok(req("admin","PUT",path+"/"+day,payload),200);assertThat(closed.path("status").asText()).isEqualTo("CLOSED");
  double frozen=closed.path("source").path("stats").path("netSales").asDouble();
  db.update("UPDATE sales SET total_amount=total_amount+3 WHERE sale_id=?",sale);
  assertThat(ok(req("admin","GET",path+"/"+day,null),200).path("source").path("stats").path("netSales").asDouble()).isEqualTo(frozen);
  payload.put("version",closed.path("version").asText());ok(req("admin","PUT",path+"/"+day,payload),409);
  var other=ok(req("admin","GET","/access/stores/"+second+"/daily-closing/"+day,null),200);assertThat(other.path("openingCash").asDouble()).isEqualTo(150);assertThat(other.path("source").path("stats").path("transactions").asInt()).isZero();assertThat(other.path("status").asText()).isEqualTo("OPEN");
  var report=ok(req("admin","GET",path+"?start=2026-05-01&end=2026-05-02",null),200);assertThat(report.size()).isEqualTo(2);
  ok(req("admin","GET",path+"?start=2026-05-02&end=2026-05-01",null),400);ok(req("admin","GET",path+"?start=2026-01-01&end=2026-05-01",null),400);
 }

 @Test @Order(112) void closingBreakdownsDepositsChecksAndCarryForward() throws Exception {
  String path=access()+"/daily-closing/2026-05-03";
  long sale=db.queryForObject("SELECT sale_id FROM sales WHERE store_id=? AND receipt_no='LIVE-1'",Long.class,store);
  long product=db.queryForObject("SELECT product_id FROM sales_items WHERE sale_id=?",Long.class,sale);
  long department=db.queryForObject("SELECT sub.store_department_id FROM products p JOIN store_sub_departments sub USING(store_sub_department_id) WHERE p.product_id=?",Long.class,product);
  db.update("UPDATE sales SET sale_datetime='2026-05-03 12:00:00-04' WHERE store_id=?",store);
  db.update("UPDATE store_departments SET store_department_name='Dairy & Groceries' WHERE store_department_id=?",department);
  var grocery=ok(req("admin","GET",path,null),200).path("source").path("closingDetails").path("fields");
  assertThat(grocery.path("Grocery – Tax").asDouble()).isEqualTo(9);
  assertThat(grocery.path("Grocery – NonTax").asDouble()).isEqualTo(-2);
  db.update("UPDATE store_departments SET store_department_name='Cigarettes' WHERE store_department_id=?",department);
  for(String unit:List.of("Pack","Carton")) {
   db.update("UPDATE products SET unit_of_measure=? WHERE product_id=?",unit,product);
   var fields=ok(req("manager","GET",path,null),200).path("source").path("closingDetails").path("fields");
   assertThat(fields.path("Cigarette "+unit).asDouble()).isEqualTo(7);
  }
  db.update("UPDATE store_departments SET store_department_name='Fuel' WHERE store_department_id=?",department);
  db.update("UPDATE products SET unit_of_measure='Gallon' WHERE product_id=?",product);
  for(var pair:Map.of("Regular Unleaded (87)","Regular","Mid-Grade Unleaded (89)","Plus","Premium Unleaded (93)","Super","Diesel #2","Diesel").entrySet()) {
   db.update("UPDATE products SET product_name=? WHERE product_id=?",pair.getKey(),product);
   var fields=ok(req("admin","GET",path,null),200).path("source").path("closingDetails").path("fields");
   assertThat(fields.path(pair.getValue()+" Volume").asDouble()).isEqualTo(10.345);
   assertThat(fields.path(pair.getValue()+" Amount Sold").asDouble()).isEqualTo(7);
  }
  long fleet=db.queryForObject("INSERT INTO tender_types(tender_code,tender_name) VALUES (?,?) RETURNING tender_type_id",Long.class,"FLEET","Test fleet "+tag);
  long cash=db.queryForObject("SELECT tender_type_id FROM tender_types WHERE tender_code='CASH'",Long.class);
  try {
   db.update("UPDATE sale_payments SET tender_type_id=? WHERE sale_id=?",fleet,sale);
   var fields=ok(req("admin","GET",path,null),200).path("source").path("closingDetails").path("fields");
   assertThat(fields.path("Fleet Card Volume Sold").asDouble()).isEqualTo(12.345);
   assertThat(fields.path("Fleet Card Amount Sold").asDouble()).isEqualTo(9.54);
   long mixed=db.queryForObject("INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status) VALUES (?,?,1,'COMPLETED') RETURNING sale_payment_id",Long.class,sale,cash);
   assertThat(ok(req("admin","GET",path,null),200).path("source").path("closingDetails").path("fields").has("Fleet Card Volume Sold")).isFalse();
   db.update("DELETE FROM sale_payments WHERE sale_payment_id=?",mixed);
  } finally {db.update("UPDATE sale_payments SET tender_type_id=? WHERE sale_id=?",cash,sale);db.update("DELETE FROM tender_types WHERE tender_type_id=?",fleet);}
  var initial=ok(req("admin","GET",path,null),200);
  var payload=new LinkedHashMap<String,Object>();payload.put("version",initial.path("version").asText());payload.put("sourceToken",initial.path("sourceToken").asText());payload.put("openingCash",100);payload.put("cashAdded",0);payload.put("cashDrops",0);payload.put("payouts",0);payload.put("actualCash",72.54);payload.put("notes","Reconciliation test");payload.put("close",false);
  var readings=new LinkedHashMap<String,Object>();readings.put("opening_checks",30);readings.put("closing_checks",20);readings.put("deposit_cash",20);readings.put("deposit_checks",10);readings.put("cash_purchases",10);readings.put("pending_invoices_paid",5);readings.put("card_jobber_settlement",40);readings.put("card_bank_settlement",50);
  for(String key:com.dgt.backend.dailyclosing.scoped.ClosingReconciliation.COLUMNS)if(key.startsWith("lottery_"))readings.put(key,3.25);
  payload.put("reconciliation",readings);
  readings.put("deposit_checks",31);ok(req("admin","PUT",path,payload),400);readings.put("deposit_checks",10);
  readings.put("cash_purchases",-1);ok(req("admin","PUT",path,payload),400);readings.put("cash_purchases",10);
  readings.put("card_bank_settlement",1.001);ok(req("admin","PUT",path,payload),400);readings.put("card_bank_settlement",50);
  readings.put("hacked",1);ok(req("admin","PUT",path,payload),400);readings.remove("hacked");
  ok(req("cashier","PUT",path,payload),403);
  var draft=ok(req("manager","PUT",path,payload),200);
  assertThat(draft.path("expectedCash").asDouble()).isEqualTo(72.54);assertThat(draft.path("variance").asDouble()).isZero();assertThat(draft.path("expectedChecks").asDouble()).isEqualTo(20);assertThat(draft.path("totalDeposits").asDouble()).isEqualTo(30);
  assertThat(draft.path("reconciliation").path("lottery_balance").asDouble()).isEqualTo(3.25);
  long id=db.queryForObject("SELECT everyday_closing_id FROM everyday_closing WHERE dgt_id=? AND business_date='2026-05-03'",Long.class,store);
  payload.put("version",draft.path("version").asText());payload.put("sourceToken",draft.path("sourceToken").asText());
  var again=ok(req("admin","PUT",path,payload),200);
  assertThat(db.queryForObject("SELECT count(*) FROM daily_closing_deposits WHERE archived_at IS NULL AND everyday_closing_id=?",Integer.class,id)).isEqualTo(1);
  assertThat(db.queryForObject("SELECT sum(amount) FROM daily_expenses WHERE archived_at IS NULL AND everyday_closing_id=?",Double.class,id)).isEqualTo(15);
  payload.put("version",again.path("version").asText());payload.put("sourceToken",again.path("sourceToken").asText());payload.put("close",true);
  var closed=ok(req("admin","PUT",path,payload),200);payload.put("version",closed.path("version").asText());ok(req("admin","PUT",path,payload),409);
  var next=ok(req("admin","GET",access()+"/daily-closing/2026-05-04",null),200);
  assertThat(next.path("openingCash").asDouble()).isEqualTo(72.54);assertThat(next.path("reconciliation").path("opening_checks").asDouble()).isEqualTo(20);assertThat(next.path("carryForwardDate").asText()).isEqualTo("2026-05-03");
  assertThat(ok(req("admin","GET",access()+"/daily-closing/2026-05-05",null),200).path("openingCash").asDouble()).isEqualTo(100);
  var other=ok(req("admin","GET","/access/stores/"+second+"/daily-closing/2026-05-03",null),200);
  assertThat(other.path("totalDeposits").asDouble()).isZero();assertThat(other.path("reconciliation").path("card_bank_settlement").isNull()).isTrue();
 }

 @Test @Order(113) void creditCardSettingsMembershipFeesAndLifecycle() throws Exception {
  String path=access()+"/credit-card";
  ok(req("cashier","GET",path,null),403);ok(req("accountant","GET",path,null),403);ok(req("other","GET",path,null),403);
  var data=ok(req("manager","GET",path,null),200);assertThat(data.path("processors").size()).isZero();assertThat(data.path("settings").path("default_fee_percent").asDouble()).isZero();
  var settings=new LinkedHashMap<String,Object>();settings.put("default_fee_percent",2.5);settings.put("per_transaction_fee",.1);settings.put("fee_difference_percent",.2);settings.put("deposit_tolerance",5);for(String key:List.of("require_fee_review","require_variance_review","enable_chargebacks","require_chargeback_reason"))settings.put(key,true);settings.put("lock_settings_after_settlement",true);
  var saved=ok(req("admin","PUT",path+"/settings",Map.of("version","0","values",settings)),200);
  ok(req("admin","PUT",path+"/settings",Map.of("version","0","values",settings)),409);
  settings.put("default_fee_percent",101);ok(req("admin","PUT",path+"/settings",Map.of("version",saved.path("version").asText(),"values",settings)),400);settings.put("default_fee_percent",2.5);
  var processor=ok(req("admin","POST",path+"/processors",Map.of("name","Test processor","active",true,"frequency","DAILY","delayDays",1,"destination","BANK","destinationLabel","Test bank")),200);long processorId=processor.path("processor_id").asLong();
  ok(req("admin","POST",path+"/processors",Map.of("name","test processor","active",true,"frequency","DAILY","delayDays",1,"destination","BANK","destinationLabel","Test bank")),409);
  var edit=new LinkedHashMap<String,Object>();edit.put("version",processor.path("version").asText());edit.put("name","Test processor");edit.put("active",false);edit.put("frequency","DAILY");edit.put("delayDays",2);edit.put("destination","JOBBER");edit.put("destinationLabel","Test jobber");var inactive=ok(req("admin","PUT",path+"/processors/"+processorId,edit),200);
  long sale=db.queryForObject("SELECT sale_id FROM sales WHERE store_id=? AND receipt_no='LIVE-1'",Long.class,store);long refund=db.queryForObject("SELECT sale_id FROM sales WHERE store_id=? AND receipt_no='LIVE-2'",Long.class,store);long credit=db.queryForObject("SELECT tender_type_id FROM tender_types WHERE tender_code='CREDIT_CARD'",Long.class);
  db.update("UPDATE sale_payments SET tender_type_id=?,payment_amount=100 WHERE sale_id=?",credit,sale);db.update("UPDATE sale_payments SET tender_type_id=?,payment_amount=-20 WHERE sale_id=?",credit,refund);
  var payments=ok(req("admin","GET",path+"/payments?date=2026-05-03",null),200);assertThat(payments.size()).isEqualTo(2);
  var selected=new LinkedHashMap<String,String>();payments.forEach(p->selected.put(p.path("sale_payment_id").asText(),p.path("version").asText()));
  var create=new LinkedHashMap<String,Object>();create.put("processorId",processorId);create.put("reference","MANUAL-TEST");create.put("date","2026-05-03");create.put("requestKey",UUID.randomUUID().toString());create.put("payments",selected);
  ok(req("manager","POST",path+"/batches",create),400);
  edit.put("version",inactive.path("version").asText());edit.put("active",true);processor=ok(req("admin","PUT",path+"/processors/"+processorId,edit),200);
  var badSelection=new LinkedHashMap<>(selected);badSelection.put("999999999","0");create.put("payments",badSelection);ok(req("admin","POST",path+"/batches",create),409);create.put("payments",selected);
  long pay=payments.get(0).path("sale_payment_id").asLong();db.update("UPDATE sale_payments SET updated_at=clock_timestamp() WHERE sale_payment_id=?",pay);ok(req("admin","POST",path+"/batches",create),409);
  payments=ok(req("admin","GET",path+"/payments?date=2026-05-03",null),200);selected.clear();payments.forEach(p->selected.put(p.path("sale_payment_id").asText(),p.path("version").asText()));
  var batch=ok(req("manager","POST",path+"/batches",create),200);long id=batch.path("batch_id").asLong();assertThat(batch.path("pos_sales").asDouble()).isEqualTo(80);assertThat(batch.path("fee_base").asDouble()).isEqualTo(100);assertThat(batch.path("expected_fee").asDouble()).isEqualTo(2.6);assertThat(batch.path("actual_fee").isNull()).isTrue();assertThat(batch.path("settlement_destination").asText()).isEqualTo("JOBBER");
  assertThat(ok(req("admin","POST",path+"/batches",create),200).path("batch_id").asLong()).isEqualTo(id);create.put("reference","Different");ok(req("admin","POST",path+"/batches",create),409);create.put("requestKey",UUID.randomUUID().toString());ok(req("admin","POST",path+"/batches",create),409);
  assertThat(ok(req("admin","GET",path+"/payments?date=2026-05-03",null),200).size()).isZero();
  settings.put("default_fee_percent",1);saved=ok(req("admin","PUT",path+"/settings",Map.of("version",saved.path("version").asText(),"values",settings)),200);assertThat(ok(req("admin","GET",path,null),200).path("batches").get(0).path("expected_fee").asDouble()).isEqualTo(2.6);
  String bp=path+"/batches/"+id;
  ok(req("admin","POST",bp+"/transition",Map.of("version",batch.path("version").asText(),"action","SETTLE")),409);
  ok(req("admin","PUT",bp+"/fee",Map.of("version",batch.path("version").asText(),"actualFee",3,"reason","")),400);
  ok(req("admin","PUT",bp+"/fee",Map.of("version",batch.path("version").asText(),"actualFee",-1)),400);
  batch=ok(req("manager","PUT",bp+"/fee",Map.of("version",batch.path("version").asText(),"actualFee",3,"reason","Statement fee","notes","reviewed")),200);
  ok(req("admin","POST",bp+"/transition",Map.of("version",batch.path("version").asText(),"action","SUBMIT","processorSales",80,"chargebacks",5)),400);
  batch=ok(req("admin","POST",bp+"/transition",Map.of("version",batch.path("version").asText(),"action","SUBMIT","processorSales",80,"chargebacks",5,"chargebackReason","Dispute")),200);
  ok(req("admin","POST",bp+"/transition",Map.of("version",batch.path("version").asText(),"action","SETTLE","receivedAmount",72,"settlementDate","2026-05-04")),400);
  batch=ok(req("manager","POST",bp+"/transition",Map.of("version",batch.path("version").asText(),"action","SETTLE","receivedAmount",72,"settlementDate","2026-05-04","reference","SETTLEMENT-1")),200);
  assertThat(batch.path("status").asText()).isEqualTo("SETTLED");
  ok(req("admin","PUT",path+"/settings",Map.of("version",saved.path("version").asText(),"values",settings)),409);
  ok(req("admin","PUT",path+"/processors/"+processorId,edit),409);
  batch=ok(req("admin","PUT",bp+"/fee",Map.of("version",batch.path("version").asText(),"actualFee",20,"reason","Additional statement fee")),200);
  ok(req("admin","POST",bp+"/transition",Map.of("version",batch.path("version").asText(),"action","RECONCILE")),400);
  batch=ok(req("manager","POST",bp+"/transition",Map.of("version",batch.path("version").asText(),"action","RECONCILE","reviewNote","Verified statement discrepancy")),200);
  ok(req("admin","PUT",bp+"/fee",Map.of("version",batch.path("version").asText(),"actualFee",20)),409);
  ok(req("admin","PUT","/access/stores/"+second+"/credit-card/batches/"+id+"/fee",Map.of("version",batch.path("version").asText(),"actualFee",20)),404);
  var other=ok(req("admin","GET","/access/stores/"+second+"/credit-card",null),200);assertThat(other.path("processors").size()).isZero();assertThat(other.path("batches").size()).isZero();assertThat(other.path("audit").size()).isZero();
  var read=ok(req("admin","GET",path,null),200);assertThat(read.path("audit").size()).isGreaterThanOrEqualTo(9);assertThat(read.path("batches").get(0).path("status").asText()).isEqualTo("RECONCILED");
 }


 @Test @Order(114) void ebtRefundsMembershipSettlementAndReview() throws Exception {
  String path=access()+"/ebt";
  for(String who:List.of("cashier","accountant","other"))ok(req(who,"GET",path,null),403);
  ok(req("admin","GET",path+"?start=2026-05-04&end=2026-05-03",null),400);
  ok(req("admin","GET",path+"?end=2999-01-01",null),400);
  ok(req("manager","GET",path,null),200);
  for(String code:List.of("EBT_SNAP","EBT_CASH"))db.update("INSERT INTO tender_types(tender_code,tender_name) VALUES (?,?) ON CONFLICT(tender_code) DO NOTHING",code,code);
  long snap=db.queryForObject("SELECT tender_type_id FROM tender_types WHERE tender_code='EBT_SNAP'",Long.class),cash=db.queryForObject("SELECT tender_type_id FROM tender_types WHERE tender_code='EBT_CASH'",Long.class);
  long sale=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,total_amount) SELECT store_id,cashier_id,terminal_id,'EBT-SALE',?,'SALE','COMPLETED','2026-05-05 12:00:00-04',120,120 FROM sales WHERE store_id=? AND receipt_no='LIVE-1' RETURNING sale_id",Long.class,"EBT-SALE-"+tag,store);
  long refund=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,total_amount) SELECT store_id,cashier_id,terminal_id,'EBT-REFUND',?,'REFUND','REFUNDED','2026-05-05 13:00:00-04',-10,-10 FROM sales WHERE sale_id=? RETURNING sale_id",Long.class,"EBT-REFUND-"+tag,sale);
  db.update("INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status) VALUES (?,?,100,'COMPLETED'),(?,?,20,'COMPLETED'),(?,?,-10,'REFUNDED')",sale,snap,sale,cash,refund,snap);
  var payments=ok(req("admin","GET",path+"/payments?date=2026-05-05",null),200);assertThat(payments.size()).isEqualTo(3);
  assertThat(ok(req("admin","GET",path+"/payments?date=2026-05-04",null),200).size()).isZero();
  Map<String,String> selected=new LinkedHashMap<>();payments.forEach(p->selected.put(p.path("sale_payment_id").asText(),p.path("version").asText()));
  var create=new LinkedHashMap<String,Object>();create.put("reference","TEST-EBT");create.put("date","2026-05-05");create.put("requestKey",UUID.randomUUID().toString());create.put("payments",selected);
  ok(req("admin","POST","/access/stores/"+second+"/ebt/batches",create),409);
  ok(req("cashier","POST",path+"/batches",create),403);
  var oldVersions=new LinkedHashMap<>(selected);selected.replaceAll((k,v)->"stale");ok(req("admin","POST",path+"/batches",create),409);selected.clear();selected.putAll(oldVersions);
  var batch=ok(req("manager","POST",path+"/batches",create),200);long id=batch.path("batch_id").asLong();String bp=path+"/batches/"+id;
  assertThat(batch.path("snap_amount").asDouble()).isEqualTo(90);assertThat(batch.path("cash_amount").asDouble()).isEqualTo(20);assertThat(batch.path("refund_amount").asDouble()).isEqualTo(10);assertThat(batch.path("transaction_count").asInt()).isEqualTo(2);assertThat(batch.path("fees").isNull()).isTrue();
  assertThat(ok(req("admin","POST",path+"/batches",create),200).path("batch_id").asLong()).isEqualTo(id);
  create.put("reference","CHANGED");ok(req("admin","POST",path+"/batches",create),409);create.put("requestKey",UUID.randomUUID().toString());ok(req("admin","POST",path+"/batches",create),409);
  assertThat(ok(req("admin","GET",path+"/payments?date=2026-05-05",null),200).size()).isZero();
  var list=ok(req("admin","GET",path+"?start=2026-05-05&end=2026-05-05",null),200).path("batches");assertThat(list.size()).isEqualTo(1);assertThat(list.get(0).path("business_date").asText()).isEqualTo("2026-05-05");assertThat(list.get(0).path("has_snap").asBoolean()).isTrue();assertThat(list.get(0).path("has_cash").asBoolean()).isTrue();
  ok(req("admin","GET","/access/stores/"+second+"/ebt/batches/"+id,null),404);
  ok(req("admin","POST",bp+"/reconcile",Map.of("version",batch.path("version").asText())),409);
  var settlement=new LinkedHashMap<String,Object>();settlement.put("version",batch.path("version").asText());settlement.put("fees",1);settlement.put("adjustment",2);settlement.put("actualDeposit",110);settlement.put("date","2026-05-06");settlement.put("reference","TEST-STATEMENT");
  ok(req("admin","PUT",bp+"/settlement",settlement),400);settlement.put("adjustmentReason","Statement correction");settlement.put("fees",-1);ok(req("admin","PUT",bp+"/settlement",settlement),400);settlement.put("fees",1.001);ok(req("admin","PUT",bp+"/settlement",settlement),400);settlement.put("fees",1);
  settlement.put("date","2026-05-04");ok(req("admin","PUT",bp+"/settlement",settlement),400);settlement.put("date","2026-05-06");settlement.put("reference","");ok(req("admin","PUT",bp+"/settlement",settlement),400);settlement.put("reference","TEST-STATEMENT");
  batch=ok(req("manager","PUT",bp+"/settlement",settlement),200);assertThat(batch.path("status").asText()).isEqualTo("SETTLED");ok(req("admin","PUT",bp+"/settlement",settlement),409);
  ok(req("admin","POST",bp+"/reconcile",Map.of("version",batch.path("version").asText(),"note","")),400);
  settlement.put("version",batch.path("version").asText());settlement.put("notes","Statement checked");batch=ok(req("admin","PUT",bp+"/settlement",settlement),200);
  batch=ok(req("manager","POST",bp+"/reconcile",Map.of("version",batch.path("version").asText(),"note","One dollar difference verified")),200);assertThat(batch.path("status").asText()).isEqualTo("RECONCILED");
  settlement.put("version",batch.path("version").asText());ok(req("admin","PUT",bp+"/settlement",settlement),409);
  var details=ok(req("admin","GET",bp,null),200);assertThat(details.path("payments").size()).isEqualTo(3);assertThat(details.path("audit").size()).isEqualTo(4);assertThat(details.path("batch").path("variance_review_note").asText()).contains("verified");
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/ebt",null),200).path("batches").size()).isZero();
  // Two concurrent requests cannot claim the same eligible payment twice.
  long extra=db.queryForObject("INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status) VALUES (?,?,5,'COMPLETED') RETURNING sale_payment_id",Long.class,sale,cash);
  var p=ok(req("admin","GET",path+"/payments?date=2026-05-05",null),200).get(0);
  var requests=new ArrayList<java.util.concurrent.CompletableFuture<Response>>();
  for(int i=0;i<2;i++){var body=Map.of("reference","RACE-"+i,"date","2026-05-05","requestKey",UUID.randomUUID().toString(),"payments",Map.of(String.valueOf(extra),p.path("version").asText()));requests.add(java.util.concurrent.CompletableFuture.supplyAsync(()->{try{return req("admin","POST",path+"/batches",body);}catch(Exception e){throw new RuntimeException(e);}}));}
  assertThat(requests.stream().map(f->f.join().code()).sorted().toList()).containsExactly(200,409);
 }
 @Test @Order(115) void fleetVolumesRefundsAmbiguityAndSettlement() throws Exception {
  String path=access()+"/fleet";
  for(String who:List.of("cashier","accountant","other"))ok(req(who,"GET",path,null),403);
  ok(req("admin","GET",path+"?start=2026-05-08&end=2026-05-07",null),400);ok(req("admin","GET",path+"?end=2999-01-01",null),400);
  db.update("INSERT INTO tender_types(tender_code,tender_name) VALUES ('FLEET_CARD','Fleet Card') ON CONFLICT(tender_code) DO NOTHING");
  long tender=db.queryForObject("SELECT tender_type_id FROM tender_types WHERE tender_code='FLEET_CARD'",Long.class),cash=db.queryForObject("SELECT tender_type_id FROM tender_types WHERE tender_code='CASH'",Long.class);
  long product=db.queryForObject("SELECT i.product_id FROM sales_items i JOIN sales s USING(sale_id) WHERE s.store_id=? AND s.receipt_no='LIVE-1'",Long.class,store);
  long sub=db.queryForObject("SELECT store_sub_department_id FROM products WHERE product_id=?",Long.class,product);
  db.update("UPDATE store_departments SET store_department_name='Fuel' WHERE store_department_id=(SELECT store_department_id FROM store_sub_departments WHERE store_sub_department_id=?)",sub);
  db.update("UPDATE products SET unit_of_measure='Gallon' WHERE product_id=?",product);
  List<Long> saleIds=new ArrayList<>();
  for(int i=0;i<6;i++){
   boolean refund=i==1;
   long sale=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,total_amount) SELECT store_id,cashier_id,terminal_id,?,?,?,'COMPLETED','2026-05-07 12:00:00-04',?,? FROM sales WHERE store_id=? AND receipt_no='LIVE-1' RETURNING sale_id",Long.class,"FLEET-"+i,"FLEET-"+tag+"-"+i,refund?"REFUND":"SALE",refund?-10:100,refund?-10:100,store);
   saleIds.add(sale);
   if(i!=3)db.update("INSERT INTO sales_items(sale_id,product_id,quantity,unit_price,gross_amount,tax_amount,line_total) VALUES (?,?,?,3,?,?,?)",sale,product,refund?-3:30,refund?-10:100,refund?-1:4,refund?-10:100);
   if(i==2||i==4)db.update("INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status) VALUES (?,?,50,'COMPLETED'),(?,?,50,'COMPLETED')",sale,tender,sale,i==2?cash:tender);
   else db.update("INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status) VALUES (?,?,?,'COMPLETED')",sale,tender,refund?-10:100);
  }
  // Voided receipts must never appear for batch creation.
  db.update("UPDATE sales SET sale_status='VOIDED',transaction_type='VOID' WHERE sale_id=?",saleIds.get(5));
  var available=ok(req("manager","GET",path+"/payments?date=2026-05-07",null),200);assertThat(available.size()).isEqualTo(6);
  Map<String,String> chosen=new LinkedHashMap<>();available.forEach(p->{if(List.of(saleIds.get(0),saleIds.get(1)).contains(p.path("sale_id").asLong()))chosen.put(p.path("sale_payment_id").asText(),p.path("version").asText());});
  var create=new LinkedHashMap<String,Object>();create.put("provider","WEX");create.put("reference","FLEET-TEST");create.put("date","2026-05-07");create.put("requestKey",UUID.randomUUID().toString());create.put("payments",chosen);
  ok(req("admin","POST","/access/stores/"+second+"/fleet/batches",create),409);ok(req("cashier","POST",path+"/batches",create),403);
  var batch=ok(req("manager","POST",path+"/batches",create),200);String bp=path+"/batches/"+batch.path("batch_id").asLong();
  assertThat(batch.path("fleet_sales").asDouble()).isEqualTo(90);assertThat(batch.path("gallons_sold").asDouble()).isEqualTo(27);assertThat(batch.path("fuel_sales").asDouble()).isEqualTo(87);assertThat(batch.path("processor_fee").isNull()).isTrue();assertThat(batch.path("transaction_count").asInt()).isEqualTo(2);assertThat(batch.path("business_date").asText()).isEqualTo("2026-05-07");
  assertThat(ok(req("admin","POST",path+"/batches",create),200).path("batch_id").asLong()).isEqualTo(batch.path("batch_id").asLong());create.put("provider","Voyager");ok(req("admin","POST",path+"/batches",create),409);create.put("requestKey",UUID.randomUUID().toString());ok(req("admin","POST",path+"/batches",create),409);
  ok(req("admin","POST",bp+"/reconcile",Map.of("version",batch.path("version").asText())),409);
  var settlement=new LinkedHashMap<String,Object>();settlement.put("version",batch.path("version").asText());settlement.put("fees",1);settlement.put("discount",2);settlement.put("actualDeposit",86);settlement.put("date","2026-05-08");settlement.put("reference","STATEMENT");
  settlement.put("discount",-1);ok(req("admin","PUT",bp+"/settlement",settlement),400);settlement.put("discount",2);settlement.put("fees",1.001);ok(req("admin","PUT",bp+"/settlement",settlement),400);settlement.put("fees",1);settlement.put("date","2026-05-06");ok(req("admin","PUT",bp+"/settlement",settlement),400);settlement.put("date","2026-05-08");settlement.put("reference","");ok(req("admin","PUT",bp+"/settlement",settlement),400);settlement.put("reference","STATEMENT");
  batch=ok(req("manager","PUT",bp+"/settlement",settlement),200);ok(req("admin","PUT",bp+"/settlement",settlement),409);assertThat(batch.path("status").asText()).isEqualTo("SETTLED");
  ok(req("admin","POST",bp+"/reconcile",Map.of("version",batch.path("version").asText(),"note","")),400);
  settlement.put("version",batch.path("version").asText());settlement.put("notes","Checked");batch=ok(req("admin","PUT",bp+"/settlement",settlement),200);
  batch=ok(req("admin","POST",bp+"/reconcile",Map.of("version",batch.path("version").asText(),"note","One dollar discrepancy reviewed")),200);settlement.put("version",batch.path("version").asText());ok(req("manager","PUT",bp+"/settlement",settlement),409);
  var details=ok(req("admin","GET",bp,null),200);assertThat(details.path("payments").size()).isEqualTo(2);assertThat(details.path("audit").size()).isEqualTo(4);
  ok(req("admin","GET","/access/stores/"+second+"/fleet/batches/"+batch.path("batch_id").asLong(),null),404);
  for(int index:List.of(2,3,4)){
   var payments=ok(req("admin","GET",path+"/payments?date=2026-05-07",null),200);Map<String,String> selected=new LinkedHashMap<>();payments.forEach(p->{if(p.path("sale_id").asLong()==saleIds.get(index))selected.put(p.path("sale_payment_id").asText(),p.path("version").asText());});
   var row=ok(req("admin","POST",path+"/batches",Map.of("provider","Voyager","reference","VOLUME-"+index,"date","2026-05-07","requestKey",UUID.randomUUID().toString(),"payments",selected)),200);
   if(index==4){assertThat(row.path("gallons_sold").asDouble()).isEqualTo(30);assertThat(row.path("transaction_count").asInt()).isEqualTo(1);}
   else{assertThat(row.path("gallons_sold").isNull()).isTrue();assertThat(row.path("fuel_sales").isNull()).isTrue();assertThat(row.path("volume_note").asText()).isNotBlank();}
  }
  assertThat(ok(req("admin","GET",path+"/payments?date=2026-05-07",null),200).size()).isZero();
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/fleet",null),200).path("batches").size()).isZero();
  // Gallon-sized merchandise is not fuel; concurrent creation still claims a payment only once.
  db.update("UPDATE sales SET sale_status='COMPLETED',transaction_type='SALE' WHERE sale_id=?",saleIds.get(5));
  db.update("UPDATE store_departments SET store_department_name='Motor Oil & Additives' WHERE store_department_id=(SELECT store_department_id FROM store_sub_departments WHERE store_sub_department_id=?)",sub);
  var payment=ok(req("admin","GET",path+"/payments?date=2026-05-07",null),200).get(0);
  var futures=new ArrayList<java.util.concurrent.CompletableFuture<Response>>();
  for(int i=0;i<2;i++){var body=Map.of("provider","Comdata","reference","RACE-"+i,"date","2026-05-07","requestKey",UUID.randomUUID().toString(),"payments",Map.of(payment.path("sale_payment_id").asText(),payment.path("version").asText()));futures.add(java.util.concurrent.CompletableFuture.supplyAsync(()->{try{return req("admin","POST",path+"/batches",body);}catch(Exception e){throw new RuntimeException(e);}}));}
  assertThat(futures.stream().map(f->f.join().code()).sorted().toList()).containsExactly(200,409);
  var winner=futures.stream().map(f->f.join()).filter(r->r.code()==200).findFirst().orElseThrow().body();assertThat(winner.path("gallons_sold").asDouble()).isZero();assertThat(winner.path("gallons_sold").isNull()).isFalse();

 }

 @Test void discountCatalogIsSharedAndFiltered() throws Exception {
  var promotionTypes=ok(req("admin","GET","/access/stores/"+store+"/promotions",null),200).get("discountTypes");
  var contractTypes=ok(req("admin","GET","/access/stores/"+store+"/vendors/contracts",null),200).get("discountTypes");
  var promotionValues=new HashMap<String,String>();
  promotionTypes.forEach(t->promotionValues.put(t.get("value").asText(),t.get("label").asText()));
  var contractValues=new HashMap<String,String>();
  contractTypes.forEach(t->contractValues.put(t.get("value").asText(),t.get("label").asText()));
  assertThat(promotionValues.keySet()).containsExactlyInAnyOrder("% Discount","Fixed Price","Buy X Get Y","Bundle");
  assertThat(contractValues.keySet()).containsExactlyInAnyOrder("PERCENT","AMOUNT");
  assertThat(promotionValues.get("% Discount")).isEqualTo(contractValues.get("PERCENT"));
  assertThat(db.queryForObject("SELECT count(*) FROM discount_type WHERE promotion_value='% Discount' AND contract_value='PERCENT'",Integer.class)).isEqualTo(1);
 }
 @Test void standaloneDiscountsPersistAndRespectStoreAndVersion() throws Exception {
  String path="/access/stores/"+store+"/discounts";
  var input=new LinkedHashMap<String,Object>();
  input.put("name","Employee");input.put("code","EMP");input.put("valueType","PERCENT");input.put("value",10);input.put("appliesTo","Whole Ticket");input.put("dailyCap",25);input.put("active",true);input.put("managerApproval",true);input.put("combinePromotions",false);input.put("allowOnRestricted",false);input.put("allowOnFuel",false);
  long id=ok(req("admin","POST",path,input),200).get("id").asLong();
  assertThat(req("admin","POST",path,input).code()).isEqualTo(409);
  var list=ok(req("admin","GET",path,null),200);
  var row=list.get("reasons").get(0);String version=row.get("version").asText();
  assertThat(row.get("name").asText()).isEqualTo("Employee");
  assertThat(row.get("managerApproval").asBoolean()).isTrue();
  list.get("history").forEach(h->assertThat(h.get("reason").asText()).isNotEqualTo("Employee"));
  assertThat(req("cashier","GET",path,null).code()).isEqualTo(403);
  assertThat(req("other","GET",path,null).code()).isEqualTo(403);
  input.put("value",101);assertThat(call("admin","PUT",path+"/"+id,input,version,null).code()).isEqualTo(400);
  input.put("value",10);input.put("active",false);
  ok(call("admin","PUT",path+"/"+id,input,version,null),200);
  assertThat(call("admin","PUT",path+"/"+id,input,version,null).code()).isEqualTo(409);
  assertThat(ok(req("admin","GET",path,null),200).get("reasons").get(0).get("active").asBoolean()).isFalse();
  assertThat(call("admin","PUT","/access/stores/"+second+"/discounts/"+id,input,version,null).code()).isEqualTo(409);
 }
 @Test @Order(1000) void checkoutDiscountCalculationApprovalAndGuards() throws Exception {
  String path="/access/stores/"+store+"/checkout-discounts";
  long employee=db.queryForObject("SELECT employee_id FROM employees WHERE user_id=?",Long.class,users.get("cashier"));
  db.update("UPDATE employees SET hire_date='2020-01-01',termination_date=NULL WHERE employee_id=?",employee);
  db.update("UPDATE employee_store_assignments SET effective_from='2020-01-01',effective_to=NULL WHERE employee_id=? AND dgt_id=?",employee,store);
  long terminal=db.queryForObject("INSERT INTO pos_terminals(store_id,terminal_code) VALUES (?,'DISCOUNT') RETURNING terminal_id",Long.class,store);
  long product=db.queryForObject("INSERT INTO products(dgt_id,product_name,product_sku,unit_of_measure,is_age_restricted,is_taxable,store_sub_department_id) VALUES (?,'Discount test',?,'ITEM',false,true,(SELECT min(store_sub_department_id) FROM store_sub_departments WHERE dgt_id=?)) RETURNING product_id",Long.class,store,"D-"+tag,store);
  long discount=db.queryForObject("INSERT INTO store_discounts(dgt_id,name,code,discount_type_id,value,applies_to,eligibility_type,daily_cap) SELECT ?,'Z Checkout','CHECKOUT',discount_type_id,10,'Whole Ticket','STUDENT',10 FROM discount_type WHERE code='PERCENT' RETURNING discount_id",Long.class,store);
  java.util.function.Supplier<Long> ticket=()->{
   String ref=UUID.randomUUID().toString();long sale=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,taxable_amount,tax_amount,discount_amount,total_amount,total_items) VALUES (?,?,?, ?,?,'SALE','OPEN',now(),50,50,3.5,0,53.5,1) RETURNING sale_id",Long.class,store,employee,terminal,ref,ref);
   db.update("INSERT INTO sales_items(sale_id,product_id,quantity,catalog_price,unit_price,gross_amount,discount_amount,taxable_amount,tax_amount,line_total) VALUES (?,?,1,50,50,50,0,50,3.5,53.5)",sale,product);return sale;
  };
  long sale=ticket.get();var input=new LinkedHashMap<String,Object>();input.put("saleId",sale);input.put("discountId",discount);input.put("itemIds",List.of());input.put("eligibilityConfirmed",false);
  assertThat(req("cashier","POST",path+"/preview",input).code()).isEqualTo(400);
  input.put("eligibilityConfirmed",true);
  assertThat(ok(req("cashier","POST",path+"/preview",input),200).get("amount").decimalValue()).isEqualByComparingTo("5");
  assertThat(db.queryForObject("SELECT total_amount FROM sales WHERE sale_id=?",java.math.BigDecimal.class,sale)).isEqualByComparingTo("53.5");
  String key=UUID.randomUUID().toString();var applied=ok(call("cashier","POST",path,input,null,key),200);assertThat(applied.get("status").asText()).isEqualTo("APPLIED");
  assertThat(ok(call("cashier","POST",path,input,null,key),200).get("id")).isEqualTo(applied.get("id"));
  assertThat(db.queryForObject("SELECT total_amount FROM sales WHERE sale_id=?",java.math.BigDecimal.class,sale)).isEqualByComparingTo("48.15");
  assertThat(req("cashier","POST",path,input).code()).isEqualTo(409);
  input.put("saleId",ticket.get());assertThat(call("cashier","POST",path,input,null,key).code()).isEqualTo(409);
  db.update("UPDATE store_discounts SET eligibility_type='EMPLOYEE',manager_approval=false WHERE discount_id=?",discount);
  input.put("employeeId",employee);
  var pending=ok(req("cashier","POST",path,input),200);long request=pending.get("id").asLong();assertThat(pending.get("status").asText()).isEqualTo("PENDING");
  assertThat(req("cashier","POST",path+"/"+request+"/approve",Map.of()).code()).isEqualTo(403);
  assertThat(req("other","POST",path+"/"+request+"/approve",Map.of()).code()).isEqualTo(403);
  ok(req("admin","POST",path+"/"+request+"/approve",Map.of()),200);
  ok(req("admin","POST",path+"/"+request+"/approve",Map.of()),200);
  input.put("saleId",ticket.get());assertThat(req("cashier","POST",path,input).code()).isEqualTo(409); // cap consumed
  db.update("UPDATE store_discounts SET daily_cap=0,manager_approval=true WHERE discount_id=?",discount);
  request=ok(req("admin","POST",path,input),200).get("id").asLong();
  assertThat(req("admin","POST",path+"/"+request+"/approve",Map.of()).code()).isEqualTo(403);
  ok(req("admin","POST",path+"/"+request+"/reject",Map.of()),200);
  input.put("saleId",ticket.get());request=ok(req("cashier","POST",path,input),200).get("id").asLong();
  db.update("UPDATE store_discounts SET value=15 WHERE discount_id=?",discount);
  assertThat(req("admin","POST",path+"/"+request+"/approve",Map.of()).code()).isEqualTo(409);
  ok(req("admin","POST",path+"/"+request+"/reject",Map.of()),200);
  long closed=ticket.get();db.update("UPDATE sales SET sale_status='COMPLETED' WHERE sale_id=?",closed);input.put("saleId",closed);assertThat(req("cashier","POST",path,input).code()).isEqualTo(409);
  long paid=ticket.get();db.update("INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status) SELECT ?,tender_type_id,1,'COMPLETED' FROM tender_types WHERE tender_code='CASH'",paid);input.put("saleId",paid);assertThat(req("cashier","POST",path,input).code()).isEqualTo(409);
  input.put("saleId",ticket.get());input.put("employeeId",-1);assertThat(req("cashier","POST",path,input).code()).isEqualTo(400);
  assertThat(req("accountant","GET",path+"/options",null).code()).isEqualTo(403);
  assertThat(ok(req("cashier","GET",path+"/options",null),200).get("employees").size()).isGreaterThan(0);
  // Restrictions apply before calculating the amount.
  input.put("employeeId",employee);db.update("UPDATE products SET is_age_restricted=true WHERE product_id=?",product);assertThat(req("cashier","POST",path+"/preview",input).code()).isEqualTo(400);
  db.update("UPDATE products SET is_age_restricted=false,unit_of_measure='GAL' WHERE product_id=?",product);assertThat(req("cashier","POST",path+"/preview",input).code()).isEqualTo(400);
  db.update("UPDATE products SET unit_of_measure='ITEM' WHERE product_id=?",product);
  // Employees without website accounts are eligible through their store assignment.
  long offline=db.queryForObject("INSERT INTO employees(first_name,last_name,hire_date,employee_type) VALUES (?,'Discount fixture','2020-01-01','FULL_TIME') RETURNING employee_id",Long.class,tag);
  db.update("INSERT INTO employee_store_assignments(employee_id,dgt_id,effective_from) VALUES (?,?,'2020-01-01')",offline,store);
  db.update("UPDATE store_discounts SET manager_approval=false,value=10 WHERE discount_id=?",discount);
  input.put("saleId",ticket.get());input.put("employeeId",offline);
  assertThat(ok(req("cashier","POST",path,input),200).get("status").asText()).isEqualTo("APPLIED");
  db.update("UPDATE employees SET termination_date=CURRENT_DATE WHERE employee_id=?",offline);input.put("saleId",ticket.get());assertThat(req("cashier","POST",path,input).code()).isEqualTo(400);
  // Fixed amount cannot exceed the eligible net amount; tax also reaches zero.
  db.update("UPDATE store_discounts SET eligibility_type='NONE',discount_type_id=(SELECT discount_type_id FROM discount_type WHERE code='AMOUNT'),value=100 WHERE discount_id=?",discount);
  input.remove("employeeId");long free=ticket.get();input.put("saleId",free);
  ok(req("cashier","POST",path,input),200);
  assertThat(db.queryForObject("SELECT total_amount FROM sales WHERE sale_id=?",java.math.BigDecimal.class,free)).isEqualByComparingTo("0");
  // Existing line discounts cannot be stacked unless explicitly enabled.
  long stacked=ticket.get();input.put("saleId",stacked);
  db.update("UPDATE sales_items SET discount_amount=5,taxable_amount=45,tax_amount=3.15,line_total=48.15 WHERE sale_id=?",stacked);
  db.update("UPDATE sales SET subtotal=45,discount_amount=5,taxable_amount=45,tax_amount=3.15,total_amount=48.15 WHERE sale_id=?",stacked);
  assertThat(req("cashier","POST",path+"/preview",input).code()).isEqualTo(400);
  db.update("UPDATE store_discounts SET combine_promotions=true,value=1 WHERE discount_id=?",discount);
  ok(req("cashier","POST",path,input),200);
  assertThat(db.queryForObject("SELECT discount_amount FROM sales WHERE sale_id=?",java.math.BigDecimal.class,stacked)).isEqualByComparingTo("6");
  // Inactive rules cannot be applied.
  db.update("UPDATE store_discounts SET active=false WHERE discount_id=?",discount);input.put("saleId",ticket.get());assertThat(req("cashier","POST",path,input).code()).isEqualTo(400);

 }
 @Test @Order(1100) void rebateProgramsAndItemLinksAreStoreScopedAndPersistent() throws Exception {
  String path="/access/stores/"+store+"/rebates";
  long vendor=ok(req("admin","POST","/access/stores/"+store+"/vendors",Map.of("name","Rebate provider","active",true)),200).get("id").asLong();
  long product=db.queryForObject("SELECT min(product_id) FROM products WHERE dgt_id=? AND is_active",Long.class,store);
  long secondProduct=db.queryForObject("SELECT max(product_id) FROM products WHERE dgt_id=? AND is_active",Long.class,store);
  var form=new LinkedHashMap<String,Object>();form.put("name","Rebate test");form.put("vendorId",Long.toString(vendor));form.put("vendor","ignored client provider label");form.put("offeredByType","Vendor / Distributor");form.put("rebateType","Percentage");form.put("startDate","2026-01-01");form.put("endDate","2099-12-31");form.put("status","Active");form.put("eligibilityScope","Specific Products");form.put("scopeValue","");form.put("selectedProductIds",List.of(Long.toString(product)));form.put("qualificationType","No Minimum Requirement");form.put("target","");form.put("measurementBasis","Purchases");form.put("rewardType","Percentage");form.put("rewardValue","5");form.put("calculation","On qualifying purchases");form.put("claimFrequency","Monthly");form.put("claimRequired",true);form.put("submissionDeadlineDays","15");form.put("paymentMethod","Vendor Credit");form.put("tiers",List.of());form.put("description","Saved rules");
  assertThat(req("cashier","GET",path,null).code()).isEqualTo(403);
  assertThat(req("other","GET",path,null).code()).isEqualTo(403);
  assertThat(req("admin","POST",path+"/programs",form).code()).isEqualTo(400);
  db.update("INSERT INTO product_vendors(product_id,vendor_id,dgt_id,unit_type,unit_of_measure,unit_cost,is_primary) VALUES (?,?,?,'ITEM','ITEM',1,false)",product,vendor,store);
  long id=ok(req("admin","POST",path+"/programs",form),200).get("id").asLong();
  var result=ok(req("admin","GET",path,null),200);var program=result.get("programs").get(0);String version=program.get("version").asText();
  assertThat(program.get("vendor").asText()).isEqualTo("Rebate provider");assertThat(program.get("rewardValue").asText()).isEqualTo("5");assertThat(program.get("selectedProductIds").size()).isEqualTo(1);
  assertThat(ok(req("admin","GET",path+"/programs/"+id+"/eligible",null),200).size()).isEqualTo(1);
  var link=result.get("items").get(0);long linkId=link.get("id").asLong();var body=new LinkedHashMap<String,Object>();body.put("programId",id);body.put("productId",product);body.put("active",true);body.put("rebateAmount","5% of qualifying purchases");body.put("startDate","2026-02-01");body.put("endDate","2099-01-01");
  assertThat(req("admin","POST",path+"/items",body).code()).isEqualTo(409);
  ok(call("admin","PUT",path+"/items/"+linkId,body,link.get("version").asText(),null),200);
  assertThat(call("admin","PUT",path+"/programs/"+id,form,version,null).code()).isEqualTo(409);
  assertThat(call("admin","PUT",path+"/items/"+linkId,body,link.get("version").asText(),null).code()).isEqualTo(409);
  assertThat(req("other","GET",path+"/programs/"+id+"/eligible",null).code()).isEqualTo(403);
  body.put("programId",-1);assertThat(req("admin","POST",path+"/items",body).code()).isEqualTo(400);body.put("programId",id);
  body.put("productId",-1);assertThat(req("admin","POST",path+"/items",body).code()).isEqualTo(400);body.put("productId",product);
  var updated=ok(req("admin","GET",path,null),200);assertThat(updated.get("items").get(0).get("rebateAmount").asText()).contains("5%");
  body.put("active",false);ok(call("admin","PUT",path+"/items/"+linkId,body,updated.get("items").get(0).get("version").asText(),null),200);
  assertThat(ok(req("admin","GET",path+"/programs/"+id+"/eligible",null),200).size()).isZero();
  form.put("endDate","2025-01-01");assertThat(req("admin","POST",path+"/programs",form).code()).isEqualTo(400);form.put("endDate","2099-12-31");
  form.put("vendorId","-1");assertThat(req("admin","POST",path+"/programs",form).code()).isEqualTo(400);form.put("vendorId",Long.toString(vendor));
  form.put("eligibilityScope","Department");form.put("scopeValue","-1");assertThat(req("admin","POST",path+"/programs",form).code()).isEqualTo(400);
  form.put("eligibilityScope","Specific Products");form.put("scopeValue","");form.put("rewardValue","101");assertThat(req("admin","POST",path+"/programs",form).code()).isEqualTo(400);form.put("rewardValue","5");
  // Broad scopes resolve current store classifications; provider scope uses real vendor links.
  long sub=db.queryForObject("SELECT store_sub_department_id FROM products WHERE product_id=?",Long.class,product);
  form.put("eligibilityScope","Subdepartment");form.put("scopeValue",Long.toString(sub));
  long scoped=ok(req("admin","POST",path+"/programs",form),200).get("id").asLong();
  assertThat(ok(req("admin","GET",path+"/programs/"+scoped+"/eligible",null),200).size()).isGreaterThan(0);
  form.put("eligibilityScope","All Products from Provider");form.put("scopeValue","");
  db.update("DELETE FROM product_vendors WHERE product_id=? AND vendor_id=? AND dgt_id=?",product,vendor,store);
  long providerScope=ok(req("admin","POST",path+"/programs",form),200).get("id").asLong();
  assertThat(ok(req("admin","GET",path+"/programs/"+providerScope+"/eligible",null),200).size()).isZero();
  db.update("INSERT INTO product_vendors(product_id,vendor_id,dgt_id,unit_type,unit_of_measure,unit_cost,is_primary) VALUES (?,?,?,'ITEM','ITEM',1,false)",product,vendor,store);
  assertThat(ok(req("admin","GET",path+"/programs/"+providerScope+"/eligible",null),200).size()).isEqualTo(1);
  form.put("offeredByType","Manufacturer");form.put("vendor","Manufacturer name");assertThat(req("admin","POST",path+"/programs",form).code()).isEqualTo(400);
  form.put("eligibilityScope","Specific Products");long manufacturer=ok(req("admin","POST",path+"/programs",form),200).get("id").asLong();
  String claimsPath=path+"/claims";
  assertThat(req("cashier","GET",claimsPath,null).code()).isEqualTo(403);
  assertThat(req("other","GET",claimsPath,null).code()).isEqualTo(403);
  var claimForm=new LinkedHashMap<String,Object>();claimForm.put("programId",id);claimForm.put("periodStart","2026-02-01");claimForm.put("periodEnd","2026-02-28");claimForm.put("claimed","100.50");claimForm.put("action","draft");
  long claimId=ok(req("admin","POST",claimsPath,claimForm),200).get("id").asLong();
  assertThat(req("admin","POST",claimsPath,claimForm).code()).isEqualTo(400);
  claimForm.put("periodStart","2026-02-15");assertThat(req("admin","POST",claimsPath,claimForm).code()).isEqualTo(400);
  var claimRow=ok(req("admin","GET",claimsPath,null),200).get(0);
  String actionPath=claimsPath+"/"+claimId+"/actions",cv=claimRow.get("version").asText();
  assertThat(claimRow.get("earned").isNull()).isTrue();
  assertThat(call("admin","POST",actionPath,Map.of("action","approve","approved","90","approvalDate","2026-03-01"),cv,null).code()).isEqualTo(400);
  ok(call("admin","POST",actionPath,Map.of("action","submit","claimed","100.50","submittedDate","2026-03-01"),cv,null),200);
  assertThat(call("admin","POST",actionPath,Map.of("action","notes","notes","stale"),cv,null).code()).isEqualTo(409);
  cv=ok(req("admin","GET",claimsPath,null),200).get(0).get("version").asText();
  assertThat(call("admin","POST",actionPath,Map.of("action","approve","approved","101","approvalDate","2026-03-02"),cv,null).code()).isEqualTo(400);
  assertThat(call("admin","POST",actionPath,Map.of("action","approve","approved","90","approvalDate","2026-03-02"),cv,null).code()).isEqualTo(400);
  ok(call("admin","POST",actionPath,Map.of("action","approve","approved","90","approvalDate","2026-03-02","adjustmentReason","Provider adjustment"),cv,null),200);
  claimRow=ok(req("admin","GET",claimsPath,null),200).get(0);cv=claimRow.get("version").asText();
  assertThat(claimRow.get("status").asText()).isEqualTo("Partially Approved");
  var payment=new LinkedHashMap<String,Object>();payment.put("action","payment");payment.put("payment","40");payment.put("paymentMethod","ACH Transfer");payment.put("paymentDate","2026-03-03");payment.put("paymentRef","ACH-TEST-1");payment.put("requestKey",UUID.randomUUID().toString());
  ok(call("admin","POST",actionPath,payment,cv,null),200);
  ok(call("admin","POST",actionPath,payment,cv,null),200); // retry is not a second receipt
  claimRow=ok(req("admin","GET",claimsPath,null),200).get(0);cv=claimRow.get("version").asText();
  assertThat(claimRow.get("payment").decimalValue()).isEqualByComparingTo("40");
  assertThat(claimRow.get("payments").size()).isEqualTo(1);
  assertThat(claimRow.get("status").asText()).isEqualTo("Partially Paid");
  payment.put("payment","41");assertThat(call("admin","POST",actionPath,payment,cv,null).code()).isEqualTo(409);
  payment.put("requestKey",UUID.randomUUID().toString());payment.put("payment","51");
  assertThat(call("admin","POST",actionPath,payment,cv,null).code()).isEqualTo(400);
  payment.put("payment","50");payment.put("paymentRef","ACH-TEST-2");
  ok(call("admin","POST",actionPath,payment,cv,null),200);
  claimRow=ok(req("admin","GET",claimsPath,null),200).get(0);
  assertThat(claimRow.get("status").asText()).isEqualTo("Paid");
  assertThat(claimRow.get("payments").size()).isEqualTo(2);
  assertThat(claimRow.get("payment").decimalValue()).isEqualByComparingTo("90");
  form.put("offeredByType","Vendor / Distributor");form.put("status","Inactive");
  program=null;for(var row:ok(req("admin","GET",path,null),200).get("programs"))if(row.get("id").asLong()==id)program=row;
ok(call("admin","PUT",path+"/programs/"+id,form,program.get("version").asText(),null),200);
  for(var row:ok(req("admin","GET",path,null),200).get("programs"))if(row.get("id").asLong()==id)assertThat(row.get("status").asText()).isEqualTo("Inactive");
 }
 @Test @Order(1200) void groceryReportsUseApprovedStoreDataAndUnitCosts() throws Exception {
  String path=access()+"/grocery-reports";
  long vendor=ok(req("admin","POST",access()+"/vendors",Map.of("name","Reports vendor","active",true)),200).get("id").asLong();
  long sub=db.queryForObject("SELECT min(s.store_sub_department_id) FROM store_sub_departments s JOIN store_departments d ON d.store_department_id=s.store_department_id WHERE s.dgt_id=? AND lower(d.store_department_name) NOT IN ('gas','fuel')",Long.class,store);
  long product=db.queryForObject("INSERT INTO products(dgt_id,store_sub_department_id,product_name,product_sku,unit_of_measure) VALUES (?,?,?, ?,'item') RETURNING product_id",Long.class,store,sub,"Report item","REPORT-"+tag);
  long invoice=db.queryForObject("INSERT INTO invoices(dgt_id,vendor_id,invoice_number,invoice_type,invoice_date,received_by,approved_by,approved_at) VALUES (?,?,?,'GROCERY','2026-01-05',?,?,now()) RETURNING invoice_id",Long.class,store,vendor,"REPORT-"+tag,users.get("admin"),users.get("admin"));
  db.update("INSERT INTO grocery_invoice_items(invoice_id,product_id,quantity,received_quantity,unit_type,case_pack_quantity,unit_cost,item_line_total,line_tax,is_product_new) VALUES (?,?,2,1,'CASE',6,12,24,1.50,false)",invoice,product);
  var report=ok(req("admin","GET",path+"/purchases?start=2026-01-05&end=2026-01-05",null),200);
  JsonNode line=null,header=null;
  for(var r:report.get("invoices"))if(r.get("id").asLong()==invoice)header=r;
  for(var r:report.get("items"))if(r.get("invoiceId").asLong()==invoice)line=r;
  assertThat(header).isNotNull();assertThat(line).isNotNull();
  assertThat(header.get("invoiceAmount").decimalValue()).isEqualByComparingTo("25.50");
  assertThat(header.get("paidAmount").isNull()).isTrue();assertThat(header.get("rebateAmount").isNull()).isTrue();
  assertThat(line.get("receivedQty").decimalValue()).isEqualByComparingTo("6");
  assertThat(line.get("unitCost").decimalValue()).isEqualByComparingTo("2");
  assertThat(line.get("extendedCost").decimalValue()).isEqualByComparingTo("24");
  db.update("UPDATE invoices SET approved_at=NULL,approved_by=NULL WHERE invoice_id=?",invoice);
  for(var r:ok(req("admin","GET",path+"/purchases",null),200).get("invoices"))assertThat(r.get("id").asLong()).isNotEqualTo(invoice);
  for(String suffix:List.of("/purchases","/sales","/stock")){
   assertThat(req("cashier","GET",path+suffix,null).code()).isEqualTo(403);
   assertThat(req("other","GET",path+suffix,null).code()).isEqualTo(403);
   ok(req("admin","GET",path+suffix,null),200);
  }
  long sale=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,total_amount) SELECT store_id,cashier_id,terminal_id,'REPORT-SALE',?,'SALE','COMPLETED','2026-06-10 23:59:00-04',18,19.26 FROM sales WHERE store_id=? AND receipt_no='LIVE-1' RETURNING sale_id",Long.class,"REPORT-"+tag,store);
  db.update("INSERT INTO sales_items(sale_id,product_id,quantity,gross_amount,discount_amount,tax_amount,line_total) VALUES (?,?,2,20,2,1.26,19.26)",sale,product);
  long refund=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,total_amount) SELECT store_id,cashier_id,terminal_id,'REPORT-REFUND',?,'REFUND','REFUNDED','2026-06-10 23:59:30-04',-9,-9.63 FROM sales WHERE sale_id=? RETURNING sale_id",Long.class,"REPORT-REFUND-"+tag,sale);
  db.update("INSERT INTO sales_items(sale_id,product_id,quantity,gross_amount,discount_amount,tax_amount,line_total) VALUES (?,?,-1,-10,1,-0.63,-9.63)",refund,product);
  var rows=ok(req("admin","GET",path+"/sales?start=2026-06-10&end=2026-06-10",null),200).get("rows");
  JsonNode saleRow=null;for(var r:rows)if(r.get("id").asLong()==product)saleRow=r;
  assertThat(saleRow).isNotNull();assertThat(saleRow.get("unitsSold").decimalValue()).isEqualByComparingTo("1");
  assertThat(saleRow.get("netSales").decimalValue()).isEqualByComparingTo("9");
  assertThat(saleRow.get("tax").decimalValue()).isEqualByComparingTo("0.63");
  assertThat(req("admin","GET",path+"/sales?start=2026-09-02&end=2026-09-01",null).code()).isEqualTo(400);
  assertThat(req("admin","GET",path+"/purchases?start=2026-09-02&end=2026-09-01",null).code()).isEqualTo(400);
  for(var r:ok(req("admin","GET","/access/stores/"+second+"/grocery-reports/purchases",null),200).get("items"))assertThat(r.get("productId").asLong()).isNotEqualTo(product);
 }

 @Test @Order(1210) void posReportsAreScopedReadOnlyAndUseStoreLocalSaleLines() throws Exception {
  String path=access()+"/pos-reports?start=2026-06-10&end=2026-06-10";
  for(String role:List.of("cashier","accountant","other"))assertThat(req(role,"GET",path,null).code()).isEqualTo(403);
  ok(req("manager","GET",path,null),200);
  long before=db.queryForObject("SELECT count(*) FROM everyday_closing WHERE dgt_id=?",Long.class,store);
  var report=ok(req("admin","GET",path,null),200);
  assertThat(report.get("start").asText()).isEqualTo("2026-06-10");
  assertThat(report.get("end").asText()).isEqualTo("2026-06-10");
  JsonNode sale=null,refund=null;
  for(var line:report.get("rows"))if(line.get("sku").asText().equals("REPORT-"+tag)){
   if(line.get("direction").asInt()==1)sale=line;else refund=line;
  }
  assertThat(sale).isNotNull();assertThat(refund).isNotNull();
  assertThat(sale.get("hour").asInt()).isEqualTo(23);
  assertThat(sale.get("gross").decimalValue()).isEqualByComparingTo("20");
  assertThat(refund.get("quantity").decimalValue()).isEqualByComparingTo("1");
  assertThat(refund.get("discount").decimalValue()).isEqualByComparingTo("1");
  assertThat(report.get("closing").get("date").asText()).isEqualTo("2026-06-10");
  assertThat(db.queryForObject("SELECT count(*) FROM everyday_closing WHERE dgt_id=?",Long.class,store)).isEqualTo(before);
  for(var line:ok(req("admin","GET",access()+"/pos-reports?start=2026-06-11&end=2026-06-11",null),200).get("rows"))assertThat(line.get("sku").asText()).isNotEqualTo("REPORT-"+tag);
  for(var line:ok(req("admin","GET","/access/stores/"+second+"/pos-reports?start=2026-06-10&end=2026-06-10",null),200).get("rows"))assertThat(line.get("sku").asText()).isNotEqualTo("REPORT-"+tag);
  assertThat(req("admin","GET",access()+"/pos-reports?start=2026-06-11&end=2026-06-10",null).code()).isEqualTo(400);
  assertThat(req("admin","GET",access()+"/pos-reports?start=2024-01-01&end=2026-01-01",null).code()).isEqualTo(400);
  assertThat(req("admin","GET",access()+"/pos-reports?start=2099-01-01&end=2099-01-01",null).code()).isEqualTo(400);
 }

 @Test @Order(1220) void tenderReportsScopeDatesRefundSnapshotsAndReadOnly() throws Exception {
  String path=access()+"/tender-reports";
  var before=db.queryForList("SELECT batch_id,xmin::text FROM credit_card_batches WHERE dgt_id=? ORDER BY batch_id",store);
  long audit=db.queryForObject("SELECT count(*) FROM access_audit_events WHERE dgt_id=?",Long.class,store);
  for(String who:List.of("cashier","accountant","other"))ok(req(who,"GET",path,null),403);
  ok(req(null,"GET",path,null),401);
  for(String query:List.of("?family=unknown","?start=2026-05-04&end=2026-05-03","?end=2999-01-01","?start=2024-01-01&end=2026-05-03","?asOf=2026-05-03&start=2026-05-01","?asOf=1899-01-01"))ok(req("admin","GET",path+query,null),400);
  var card=ok(req("manager","GET",path+"?family=card&start=2026-05-03&end=2026-05-03",null),200).path("rows");
  assertThat(card.size()).isEqualTo(1);assertThat(card.get(0).path("pos_sales").asDouble()).isEqualTo(80);
  assertThat(card.get(0).path("refund_amount").asDouble()).isEqualTo(20);assertThat(card.get(0).path("actual_fee").asDouble()).isEqualTo(20);
  assertThat(card.get(0).path("settlement_date").asText()).isEqualTo("2026-05-04");assertThat(card.get(0).path("received_amount").asDouble()).isEqualTo(72);
  assertThat(ok(req("admin","GET",path+"?asOf=2026-05-02",null),200).path("rows").size()).isZero();
  assertThat(ok(req("admin","GET",path+"?asOf=2026-05-03",null),200).path("rows").size()).isEqualTo(1);
  var tenders=ok(req("admin","GET",path+"?family=tender&start=2026-05-05&end=2026-05-07",null),200).path("rows");
  var ebt=java.util.stream.StreamSupport.stream(tenders.spliterator(),false).filter(b->b.path("batch_reference").asText().equals("TEST-EBT")).findFirst().orElseThrow();
  assertThat(ebt.path("kind").asText()).isEqualTo("ebt");assertThat(ebt.path("snap_amount").asDouble()).isEqualTo(90);assertThat(ebt.path("cash_amount").asDouble()).isEqualTo(20);assertThat(ebt.path("refund_amount").asDouble()).isEqualTo(10);
  var fleet=java.util.stream.StreamSupport.stream(tenders.spliterator(),false).filter(b->b.path("batch_reference").asText().equals("FLEET-TEST")).findFirst().orElseThrow();
  assertThat(fleet.path("kind").asText()).isEqualTo("fleet");assertThat(fleet.path("refund_amount").asDouble()).isEqualTo(10);assertThat(fleet.path("statement_discount").asDouble()).isEqualTo(2);assertThat(fleet.path("processor_fee").asDouble()).isEqualTo(1);
  assertThat(ok(req("admin","GET",path+"?family=tender&asOf=2026-05-04",null),200).path("rows").size()).isZero();
  for(String family:List.of("card","tender"))assertThat(ok(req("admin","GET","/access/stores/"+second+"/tender-reports?family="+family+"&asOf=2026-05-08",null),200).path("rows").size()).isZero();
  ok(req("manager","GET","/access/stores/"+foreign+"/tender-reports",null),403);
  assertThat(db.queryForList("SELECT batch_id,xmin::text FROM credit_card_batches WHERE dgt_id=? ORDER BY batch_id",store)).isEqualTo(before);
  assertThat(db.queryForObject("SELECT count(*) FROM access_audit_events WHERE dgt_id=?",Long.class,store)).isEqualTo(audit);
 }

 @Test @Order(1230) void salesStatisticsUseStoreLocalLinesAndEqualComparisonPeriod() throws Exception {
  String path=access()+"/sales-statistics";
  for(String role:List.of("cashier","accountant","other"))ok(req(role,"GET",path,null),403);
  ok(req(null,"GET",path,null),401);ok(req("manager","GET",path,null),200);
  var before=db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Long.class,store);
  var report=ok(req("admin","GET",path+"?start=2026-06-10&end=2026-06-10",null),200);
  assertThat(report.path("days").asInt()).isEqualTo(1);assertThat(report.path("previousStart").asText()).isEqualTo("2026-06-09");assertThat(report.path("timezone").asText()).isEqualTo("America/New_York");
  var rows=java.util.stream.StreamSupport.stream(report.path("rows").spliterator(),false).filter(r->r.path("name").asText().equals("Report item")).toList();assertThat(rows.size()).isEqualTo(2);
  assertThat(rows.get(0).path("hour").asInt()).isEqualTo(23);assertThat(rows.get(0).path("gross").asDouble()).isEqualTo(20);assertThat(rows.get(1).path("direction").asInt()).isEqualTo(-1);assertThat(rows.get(1).path("discount").asDouble()).isEqualTo(1);
  var next=ok(req("admin","GET",path+"?start=2026-06-11&end=2026-06-11",null),200);
  for(var r:next.path("rows"))if(r.path("name").asText().equals("Report item"))assertThat(r.path("date").asText()).isLessThan(next.path("start").asText());
  for(var r:ok(req("admin","GET","/access/stores/"+second+"/sales-statistics?start=2026-06-10&end=2026-06-10",null),200).path("rows"))assertThat(r.path("name").asText()).isNotEqualTo("Report item");
  for(String query:List.of("?start=2026-06-11&end=2026-06-10","?start=2024-01-01&end=2026-06-10","?start=2999-01-01&end=2999-01-01"))ok(req("admin","GET",path+query,null),400);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Long.class,store)).isEqualTo(before);
 }

 @Test @Order(999) void runtimeCannotDeleteOrChangeSchema() {
  org.junit.jupiter.api.Assumptions.assumeTrue("dgt_retention_test".equals(runtimeDb.queryForObject("SELECT current_user",String.class)));
  for(String sql:List.of("DELETE FROM products WHERE false","TRUNCATE product_barcodes","ALTER TABLE products DROP COLUMN product_name","DROP TABLE product_barcodes","CREATE TABLE public.forbidden_table(id int)")){
   var connection=runtimeDb.getDataSource();
   var tx=new org.springframework.transaction.support.TransactionTemplate(new org.springframework.jdbc.datasource.DataSourceTransactionManager(connection));
   tx.executeWithoutResult(status->{
    try {assertThatThrownBy(()->runtimeDb.execute(sql)).isInstanceOf(org.springframework.dao.DataAccessException.class);}
    finally {status.setRollbackOnly();}
   });
  }
 }
 @Test @Order(998) void gasDashboardReadsCurrentStoreStateOnly() throws Exception {
  String path=access()+"/gas-prices/dashboard";
  ok(req("other","GET",path,null),403);ok(req("cashier","GET",path,null),403);
  long tank=db.queryForObject("INSERT INTO fuel_tanks(dgt_id,tank_number,capacity_gallons,safe_fill_capacity,low_level_percentage) VALUES (?,'DASH-LOW',1000,900,20) RETURNING tank_id",Long.class,store);
  long empty=db.queryForObject("INSERT INTO fuel_tanks(dgt_id,tank_number,capacity_gallons,safe_fill_capacity) VALUES (?,'DASH-EMPTY',1000,900) RETURNING tank_id",Long.class,store);
  db.update("INSERT INTO fuel_tank_readings(tank_id,volume_gallons,reading_datetime,created_by) VALUES (?,100,CURRENT_TIMESTAMP-interval '2 days',?),(?,900,CURRENT_TIMESTAMP+interval '1 day',?)",tank,users.get("admin"),tank,users.get("admin"));
  db.update("UPDATE gas_settings SET low_tank_dashboard=true,missing_reading_dashboard=true WHERE dgt_id=?",store);
  int before=db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Integer.class,store);
  var result=ok(req("admin","GET",path,null),200);
  var rows=java.util.stream.StreamSupport.stream(result.path("tanks").spliterator(),false).toList();
  var low=rows.stream().filter(t->t.path("id").asLong()==tank).findFirst().orElseThrow();
  assertThat(low.path("currentGallons").asDouble()).isEqualTo(100);assertThat(low.path("threshold").asDouble()).isEqualTo(20);
  assertThat(low.path("missingToday").asBoolean()).isTrue();assertThat(low.path("lowEnabled").asBoolean()).isTrue();
  assertThat(rows.stream().filter(t->t.path("id").asLong()==empty).findFirst().orElseThrow().path("currentGallons").isNull()).isTrue();
  for(var price:result.path("prices"))assertThat(price.path("status").asText()).isEqualTo("CURRENT");
  var sibling=ok(req("admin","GET","/access/stores/"+second+"/gas-prices/dashboard",null),200);
  for(var t:sibling.path("tanks"))assertThat(t.path("id").asLong()).isNotIn(tank,empty);
  assertThat(db.queryForObject("SELECT count(*) FROM inventory_movements WHERE dgt_id=?",Integer.class,store)).isEqualTo(before);
 } @Test @Order(997) void lotteryReceiptConfirmationPersistsAndEnforcesScope() throws Exception {
  String path=access()+"/lottery-deliveries";
  long vendor=db.queryForObject("INSERT INTO vendors(dgt_id,vendor_name) VALUES (?,?) RETURNING vendor_id",Long.class,store,"Lottery vendor "+tag);
  long wrongVendor=db.queryForObject("INSERT INTO vendors(dgt_id,vendor_name) VALUES (?,?) RETURNING vendor_id",Long.class,second,"Lottery other "+tag);
  long game=db.queryForObject("INSERT INTO lottery_games(dgt_id,game_code,game_name,ticket_price,tickets_per_pack,pack_value,commission_percent,status) VALUES (?,'LTEST','Lottery test',5,50,250,7,'ACTIVE') RETURNING lottery_game_id",Long.class,store);
  var item=Map.of("gameId",Long.toString(game),"packNumber","000123","quantity",2,"key","ui-line-key");
  var receipt=new HashMap<String,Object>(Map.of("distributorId",Long.toString(vendor),"deliveryDate","2026-06-01","referenceNumber","LOT-TEST-"+tag,"items",List.of(item)));
  ok(req("other","GET",path,null),403);ok(req("cashier","GET",path,null),403);ok(req("cashier","POST",path,receipt),403);
  long managerRole=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) VALUES (?,?,'LOTTERY_RECEIVE_DELIVERY',true)",store,managerRole);
  String key=UUID.randomUUID().toString();var result=ok(call("manager","POST",path,receipt,null,key),200);
  assertThat(ok(call("manager","POST",path,receipt,null,key),200)).isEqualTo(result);
  var data=ok(req("admin","GET",path,null),200);assertThat(data.path("packs").size()).isEqualTo(2);
  assertThat(data.path("packs").toString()).contains("000123","000124","manager Test");
  assertThat(data.path("packs").get(0).path("packValue").decimalValue()).isEqualByComparingTo("250");
  assertThat(data.path("packs").get(0).path("startTicket").asText()).isEqualTo("0");
  assertThat(data.path("packs").get(0).path("endTicket").asInt()).isEqualTo(data.path("packs").get(0).path("ticketsCount").asInt()-1);
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/lottery-deliveries",null),200).path("packs").isEmpty()).isTrue();
  receipt.put("referenceNumber","Changed");ok(call("manager","POST",path,receipt,null,key),409);
  long invoiceCount=db.queryForObject("SELECT count(*) FROM invoices WHERE dgt_id=?",Long.class,store);
  ok(req("admin","POST",path,receipt),409);
  receipt.put("distributorId",Long.toString(wrongVendor));ok(req("admin","POST",path,receipt),400);
  receipt.put("distributorId",Long.toString(vendor));receipt.put("items",List.of(Map.of("gameId",Long.toString(game),"packNumber","000125","quantity",1),Map.of("gameId",Long.toString(game),"packNumber","bad","quantity",1)));
  ok(req("admin","POST",path,receipt),400);assertThat(db.queryForObject("SELECT count(*) FROM invoices WHERE dgt_id=?",Long.class,store)).isEqualTo(invoiceCount);
  assertThat(db.queryForObject("SELECT count(*) FROM lottery_packs WHERE dgt_id=?",Long.class,store)).isEqualTo(2);
  var first=data.path("packs").get(0);var next=data.path("packs").get(1);
  var selection=Map.of("id",first.path("id").asText(),"version",first.path("version").asText());
  var secondSelection=Map.of("id",next.path("id").asText(),"version",next.path("version").asText());
  var confirm=Map.of("action","CONFIRM","packs",List.of(selection));
  ok(req("manager","POST",path+"/decision",confirm),403);
  ok(req("admin","POST",path+"/decision",Map.of("action","REJECT","reason"," ","packs",List.of(selection))),400);
  ok(req("admin","POST",path+"/decision",Map.of("action","CONFIRM","packs",List.of(selection,Map.of("id",next.path("id").asText(),"version","0")))),409);
  assertThat(ok(req("admin","GET",path,null),200).path("packs").get(0).path("status").asText()).isEqualTo("PENDING");
  ok(req("admin","POST",path+"/decision",confirm),200);ok(req("admin","POST",path+"/decision",confirm),409);
  ok(req("admin","POST","/access/stores/"+second+"/lottery-deliveries/decision",Map.of("action","CONFIRM","packs",List.of(secondSelection))),409);
  ok(req("admin","POST",path+"/decision",Map.of("action","REJECT","reason","Damaged packaging","packs",List.of(secondSelection))),200);
  var after=ok(req("admin","GET",path,null),200);assertThat(after.path("packs").toString()).contains("CONFIRMED","REJECTED","Damaged packaging");
  assertThat(db.queryForObject("SELECT count(*) FROM access_audit_events WHERE dgt_id=? AND event_type LIKE 'LOTTERY_%'",Long.class,store)).isEqualTo(3);
 }
 @Test @Order(9971) void lotteryVerificationAndRecordedActivationAreDurable() throws Exception {
  String delivery=access()+"/lottery-deliveries",path=access()+"/lottery-verification";
  long vendor=db.queryForObject("INSERT INTO vendors(dgt_id,vendor_name) VALUES (?,?) RETURNING vendor_id",Long.class,store,"Verify supplier "+tag);
  long game=db.queryForObject("INSERT INTO lottery_games(dgt_id,game_code,game_name,ticket_price,tickets_per_pack,pack_value,commission_percent,status) VALUES (?,'VERIFY','Verify game',10,30,300,7,'ACTIVE') RETURNING lottery_game_id",Long.class,store);
  ok(req("admin","POST",delivery,Map.of("distributorId",Long.toString(vendor),"deliveryDate","2026-06-01","referenceNumber","VERIFY-"+tag,"items",List.of(Map.of("gameId",Long.toString(game),"packNumber","000900","quantity",2)))),200);
  var pending=ok(req("admin","GET",delivery,null),200).path("packs");var ids=new ArrayList<String>();var selection=new ArrayList<Map<String,String>>();
  for(var p:pending)if(p.path("gameId").asText().equals(Long.toString(game))){ids.add(p.path("id").asText());selection.add(Map.of("id",p.path("id").asText(),"version",p.path("version").asText()));}
  ok(req("cashier","GET",path,null),403);ok(req("other","GET",path,null),403);
  ok(req("admin","POST",path+"/decision",Map.of("action","VERIFY","packs",selection)),409);
  ok(req("admin","POST",delivery+"/decision",Map.of("action","CONFIRM","packs",selection)),200);
  java.util.function.Function<String,Map<String,String>> version=id->{try{for(var p:ok(req("admin","GET",path,null),200).path("packs"))if(p.path("id").asText().equals(id))return Map.of("id",id,"version",p.path("version").asText());throw new AssertionError("Missing pack");}catch(Exception e){throw new RuntimeException(e);}};
  String first=ids.get(0),secondId=ids.get(1);var firstVersion=version.apply(first);
  ok(req("admin","POST",path+"/activation",Map.of("packs",List.of(Map.of("id",first,"version",firstVersion.get("version"),"reference","TERM-1")))),409);
  ok(req("admin","POST",path+"/decision",Map.of("action","NOT_VERIFIED","reason"," ","packs",List.of(firstVersion))),400);
  ok(req("admin","POST",path+"/decision",Map.of("action","NOT_VERIFIED","reason","Seal mismatch","packs",List.of(firstVersion))),200);
  ok(req("admin","POST",path+"/decision",Map.of("action","VERIFY","packs",List.of(firstVersion))),409);
  ok(req("admin","POST",path+"/decision",Map.of("action","VERIFY","packs",List.of(version.apply(first)))),409);
  ok(req("admin","POST",path+"/decision",Map.of("action","RESTORE","packs",List.of(version.apply(first)))),200);
  db.update("UPDATE lottery_games SET status='INACTIVE' WHERE lottery_game_id=?",game);
  ok(req("admin","POST",path+"/decision",Map.of("action","VERIFY","packs",List.of(version.apply(first)))),400);
  db.update("UPDATE lottery_games SET status='ACTIVE' WHERE lottery_game_id=?",game);
  var both=List.of(version.apply(first),version.apply(secondId));
  ok(req("manager","POST",path+"/decision",Map.of("action","VERIFY","packs",both)),403);
  ok(req("admin","POST",path+"/decision",Map.of("action","VERIFY","packs",both)),200);
  var a1=Map.of("id",first,"version",version.apply(first).get("version"),"reference","TERM-001");
  var a2=Map.of("id",secondId,"version",version.apply(secondId).get("version"),"reference","");
  ok(req("admin","POST",path+"/activation",Map.of("packs",List.of(a1,a2))),400);
  assertThat(db.queryForObject("SELECT activation_reference FROM lottery_packs WHERE lottery_pack_id=?",String.class,Long.parseLong(first))).isNull();
  ok(req("manager","POST",path+"/activation",Map.of("packs",List.of(a1))),403);
  ok(req("admin","POST","/access/stores/"+second+"/lottery-verification/activation",Map.of("packs",List.of(a1))),409);
  long role=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) VALUES (?,?,'LOTTERY_ACTIVATE_PACKS',true)",store,role);
  ok(req("manager","POST",path+"/activation",Map.of("packs",List.of(a1))),200);
  ok(req("manager","POST",path+"/activation",Map.of("packs",List.of(a1))),409);
  ok(req("admin","POST",path+"/decision",Map.of("action","RESTORE","packs",List.of(version.apply(first)))),409);
  var data=ok(req("manager","GET",path,null),200);assertThat(data.path("canVerify").asBoolean()).isFalse();assertThat(data.path("canActivate").asBoolean()).isTrue();
  assertThat(data.path("packs").toString()).contains("TERM-001","activated","manager Test");
  assertThat(db.queryForObject("SELECT count(*) FROM access_audit_events WHERE dgt_id=? AND target_id=? AND event_type='LOTTERY_VERIFICATION_NOT_VERIFIED' AND changes->>'reason'='Seal mismatch'",Long.class,store,first)).isEqualTo(1);
 }
 @Test @Order(9972) void lotteryClosingSupportsSharedAndSeparateCounters() throws Exception {
  String path=access()+"/lottery-closing";ok(req("cashier","GET",path,null),403);ok(req("other","GET",path,null),403);ok(req("cashier","GET",path+"/settings",null),403);
  var setting=ok(req("admin","GET",path+"/settings",null),200);
  ok(req("admin","POST",path+"/open",Map.of("type","DAY")),400);
  ok(req("admin","PUT",path+"/settings",Map.of("version",setting.path("version").asText(),"separateCounter",false)),200);
  ok(req("admin","PUT",path+"/settings",Map.of("version",setting.path("version").asText(),"separateCounter",true)),409);
  var opened=ok(req("admin","POST",path+"/open",Map.of("type","DAY")),200);long cid=opened.path("closing").path("lottery_pack_inventory_id").asLong();
  assertThat(opened.path("closing").path("counter_separate").asBoolean()).isFalse();assertThat(opened.path("packs").isEmpty()).isFalse();
  ok(req("admin","POST",path+"/open",Map.of("type","DAY")),409);
  var lines=new ArrayList<Map<String,Object>>();for(var p:opened.path("packs"))lines.add(Map.of("id",p.path("id").asLong(),"recordedTickets",0,"lastSold",p.path("opening").asInt()-1));
  long first=opened.path("packs").get(0).path("id").asLong();int opening=opened.path("packs").get(0).path("opening").asInt();lines.set(0,Map.of("id",first,"recordedTickets",3,"lastSold",opening+1));
  long sale=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,total_amount) SELECT store_id,cashier_id,terminal_id,'LOTTERY-TEST',?,'SALE','COMPLETED',CURRENT_TIMESTAMP,6 FROM sales WHERE store_id=? AND receipt_no='LIVE-1' RETURNING sale_id",Long.class,"LOTTERY-"+tag,store);
  long product=db.queryForObject("SELECT min(product_id) FROM products WHERE dgt_id=?",Long.class,store);
  long item=db.queryForObject("INSERT INTO sales_items(sale_id,product_id,quantity,unit_price,line_total) VALUES (?,?,3,2,6) RETURNING sales_item_id",Long.class,sale,product);
  String linkPath=path+"/"+cid+"/sales";
  ok(req("cashier","PUT",linkPath,Map.of("salesItemId",item,"packId",first)),403);
  ok(req("admin","PUT","/access/stores/"+second+"/lottery-closing/"+cid+"/sales",Map.of("salesItemId",item,"packId",first)),409);
  assertThat(ok(req("admin","GET",linkPath+"?receipt=LOTTERY-TEST",null),200).size()).isEqualTo(1);
  opened=ok(req("admin","PUT",linkPath,Map.of("salesItemId",item,"packId",first)),200);
  assertThat(opened.path("packs").get(0).path("recordedTickets").asInt()).isEqualTo(3);
  opened=ok(req("admin","POST",linkPath+"/"+item+"/unlink",null),200);
  assertThat(opened.path("packs").get(0).path("recordedTickets").asInt()).isZero();
  opened=ok(req("admin","PUT",linkPath,Map.of("salesItemId",item,"packId",first)),200);
  var body=new HashMap<String,Object>(Map.of("version",opened.path("closing").path("version").asText(),"close",false,"packs",lines));
  var draft=ok(req("admin","PUT",path+"/"+cid,body),200);ok(req("admin","PUT",path+"/"+cid,body),409);
  var reload=ok(req("admin","GET",path,null),200);assertThat(reload.path("packs").get(0).path("lastSold").asInt()).isEqualTo(opening+1);
  setting=ok(req("admin","GET",path+"/settings",null),200);ok(req("admin","PUT",path+"/settings",Map.of("version",setting.path("version").asText(),"separateCounter",true)),200);
  body.put("version",draft.path("closing").path("version").asText());body.put("close",true);body.put("cashCounted",999);body.put("varianceNote","One more ticket recorded in POS than the last-ticket count");
  ok(req("admin","PUT",path+"/"+cid,body),400);body.put("salesReviewed",true);
  body.remove("varianceNote");ok(req("admin","PUT",path+"/"+cid,body),400);
  body.put("varianceNote","One more ticket recorded in POS than the last-ticket count");
  db.update("UPDATE sales_items SET quantity=4 WHERE sales_item_id=?",item);
  ok(req("admin","PUT",path+"/"+cid,body),409);
  db.update("UPDATE sales_items SET quantity=3 WHERE sales_item_id=?",item);
  var closed=ok(req("admin","PUT",path+"/"+cid,body),200);assertThat(closed.path("closing").path("cash_counted").isNull()).isTrue();assertThat(closed.path("closing").path("variance_note").asText()).contains("One more ticket");
  assertThat(closed.path("packs").get(0).path("recordedTickets").asInt()).isEqualTo(3);
  db.update("UPDATE sales_items SET quantity=4 WHERE sales_item_id=?",item);
  assertThat(ok(req("admin","GET",path+"?closingId="+cid,null),200).path("packs").get(0).path("recordedTickets").asInt()).isEqualTo(3);
  ok(req("admin","POST",linkPath+"/"+item+"/unlink",null),409);
  assertThat(closed.path("closing").path("counter_separate").asBoolean()).isFalse();ok(req("admin","PUT",path+"/"+cid,body),409);
  ok(req("admin","GET","/access/stores/"+second+"/lottery-closing?closingId="+cid,null),404);
  var next=ok(req("admin","POST",path+"/open",Map.of("type","SHIFT")),200);long nextId=next.path("closing").path("lottery_pack_inventory_id").asLong();assertThat(next.path("closing").path("counter_separate").asBoolean()).isTrue();assertThat(next.path("packs").get(0).path("opening").asInt()).isEqualTo(opening+2);
  lines.clear();for(var p:next.path("packs"))lines.add(Map.of("id",p.path("id").asLong(),"recordedTickets",0,"lastSold",p.path("opening").asInt()-1));
  body=new HashMap<>(Map.of("version",next.path("closing").path("version").asText(),"close",true,"packs",lines));ok(req("admin","PUT",path+"/"+nextId,body),400);
  body.put("salesReviewed",true);body.put("cashCounted",1);ok(req("admin","PUT",path+"/"+nextId,body),400);body.put("varianceNote","Count difference");
  var finish=ok(req("admin","PUT",path+"/"+nextId,body),200);assertThat(finish.path("packs").get(0).path("sales").decimalValue()).isEqualByComparingTo("0");assertThat(finish.path("closing").path("cash_counted").decimalValue()).isEqualByComparingTo("1");
  assertThat(ok(req("admin","GET",path+"?closingId="+cid,null),200).path("closing").path("shift_closed_at").isNull()).isFalse();
 }

 JsonNode dispositionPack(JsonNode data,long id){for(var p:data.path("settlementPacks"))if(p.path("id").asLong()==id)return p;throw new AssertionError("Missing pack "+id);}
 @Test @Order(9973) void lotteryReturnAndSettlementPersistAndLockPacks() throws Exception {
  String path=access()+"/lottery-dispositions";
  ok(req("cashier","GET",path,null),403);ok(req("other","GET",path,null),403);
  long id=db.queryForObject("SELECT min(i.pack_id) FROM lottery_pack_inventory_items i JOIN lottery_pack_inventory h USING(lottery_pack_inventory_id) WHERE h.dgt_id=?",Long.class,store);
  var data=ok(req("admin","GET",path,null),200);var pack=dispositionPack(data,id);
  assertThat(pack.path("status").asText()).isEqualTo("blocked");
  var selected=List.of(Map.of("id",Long.toString(id),"version",pack.path("version").asText()));
  ok(req("admin","POST",path,Map.of("action","SETTLE","packs",selected)),409);
  ok(req("cashier","POST",path,Map.of("action","REQUEST_RETURN","packs",selected,"returnType","partial","reason","Low sales","reference","RET-TEST")),403);
  ok(req("admin","POST","/access/stores/"+second+"/lottery-dispositions",Map.of("action","REQUEST_RETURN","packs",selected,"returnType","partial","reason","Low sales","reference","RET-TEST")),409);
  ok(req("admin","POST",path,Map.of("action","REQUEST_RETURN","packs",selected,"returnType","full","reason","Low sales","reference","RET-TEST")),409);
  data=ok(req("admin","POST",path,Map.of("action","REQUEST_RETURN","packs",selected,"returnType","partial","reason","Low sales","reference","RET-TEST")),200);
  pack=dispositionPack(data,id);assertThat(pack.path("return_status").asText()).isEqualTo("PENDING");
  ok(req("admin","POST",path,Map.of("action","CONFIRM_RETURN","packs",selected)),409);
  selected=List.of(Map.of("id",Long.toString(id),"version",pack.path("version").asText()));
  data=ok(req("admin","POST",path,Map.of("action","CONFIRM_RETURN","packs",selected)),200);
  pack=dispositionPack(data,id);assertThat(pack.path("status").asText()).isEqualTo("ready");
  var selectedReady=Map.of("id",Long.toString(id),"version",pack.path("version").asText());
  ok(req("admin","POST",path,Map.of("action","SETTLE","packs",List.of(selectedReady,Map.of("id","-1","version","0")))),409);
  assertThat(dispositionPack(ok(req("admin","GET",path,null),200),id).path("status").asText()).isEqualTo("ready");
  data=ok(req("admin","POST",path,Map.of("action","SETTLE","packs",List.of(selectedReady))),200);
  pack=dispositionPack(data,id);assertThat(pack.path("status").asText()).isEqualTo("settled");assertThat(pack.path("settlementRef").asText()).startsWith("SET-");
  assertThat(pack.path("grossSales").decimalValue()).isEqualByComparingTo("20");assertThat(pack.path("commission").decimalValue()).isEqualByComparingTo("1.40");assertThat(pack.path("netAmountDue").decimalValue()).isEqualByComparingTo("18.60");
  ok(req("admin","POST",path,Map.of("action","SETTLE","packs",List.of(selectedReady))),409);
  var closing=ok(req("admin","GET",access()+"/lottery-closing",null),200);for(var row:closing.path("packs"))assertThat(row.path("id").asLong()).isNotEqualTo(id);
  long full=db.queryForObject("SELECT min(lottery_pack_id) FROM lottery_packs WHERE dgt_id=? AND delivery_decided_at IS NOT NULL AND pack_settlement_reference IS NULL AND status_id=(SELECT status_type_id FROM status_types WHERE status_name='APPROVED') AND lottery_pack_id NOT IN (SELECT pack_id FROM lottery_pack_inventory_items)",Long.class,store);
  pack=dispositionPack(ok(req("admin","GET",path,null),200),full);
  data=ok(req("admin","POST",path,Map.of("action","REQUEST_RETURN","packs",List.of(Map.of("id",Long.toString(full),"version",pack.path("version").asText())),"returnType","full","reason","Damaged","reference","FULL-RET")),200);
  pack=dispositionPack(data,full);
  data=ok(req("admin","POST",path,Map.of("action","CONFIRM_RETURN","packs",List.of(Map.of("id",Long.toString(full),"version",pack.path("version").asText())))),200);
  assertThat(dispositionPack(data,full).path("netAmountDue").decimalValue()).isEqualByComparingTo("0");
 }

 @Test @Order(9974) void lotteryGamesAndHistoryAreScopedAndPersistent() throws Exception {
  String path=access()+"/lottery-games";ok(req("cashier","GET",path,null),403);ok(req("other","GET",path,null),403);
  var listed=ok(req("admin","GET",path,null),200);String today=listed.path("today").asText();
  var form=new HashMap<String,Object>();form.put("gameName","Catalog Test");form.put("gameCode","CAT-"+tag);form.put("ticketPrice",2);form.put("ticketsPerPack",50);form.put("commissionPercent",5);form.put("startDate",today);form.put("status",true);
  ok(req("cashier","POST",path,form),403);form.put("ticketsPerPack",1.5);ok(req("admin","POST",path,form),400);form.put("ticketsPerPack",50);var data=ok(req("admin","POST",path,form),200);
  long id=db.queryForObject("SELECT lottery_game_id FROM lottery_games WHERE dgt_id=? AND game_code=?",Long.class,store,"CAT-"+tag);
  JsonNode game=null;for(var g:data.path("games"))if(g.path("id").asLong()==id)game=g;
  assertThat(game.path("packValue").decimalValue()).isEqualByComparingTo("100");
  ok(req("admin","POST",path,form),400);form.put("version",game.path("version").asText());form.put("commissionPercent",7);
  ok(req("admin","PUT",path+"/"+id,form),400);
  String tomorrow=java.time.LocalDate.parse(today).plusDays(1).toString();form.put("commissionEffectiveDate",tomorrow);
  data=ok(req("admin","PUT",path+"/"+id,form),200);
  for(var g:data.path("games"))if(g.path("id").asLong()==id)game=g;
  assertThat(game.path("commissionPercent").asDouble()).isEqualTo(5);assertThat(game.path("scheduledCommission").asDouble()).isEqualTo(7);
  ok(req("admin","PUT",path+"/"+id,form),409);
  ok(req("admin","PUT","/access/stores/"+second+"/lottery-games/"+id,form),404);
  db.update("UPDATE lottery_games SET commission_effective_date=?::date WHERE lottery_game_id=?",today,id);
  data=ok(req("admin","GET",path,null),200);for(var g:data.path("games"))if(g.path("id").asLong()==id)game=g;
  assertThat(game.path("commissionPercent").asDouble()).isEqualTo(7);
  long existing=db.queryForObject("SELECT min(lottery_game_id) FROM lottery_packs WHERE dgt_id=?",Long.class,store);
  for(var g:data.path("games"))if(g.path("id").asLong()==existing)game=g;
  form.put("version",game.path("version").asText());form.put("gameCode",game.path("gameCode").asText());form.put("ticketPrice",999);form.put("commissionPercent",game.path("commissionPercent").asDouble());
  ok(req("admin","PUT",path+"/"+existing,form),400);
  String history=access()+"/lottery-pack-history";ok(req("cashier","GET",history,null),403);ok(req("other","GET",history,null),403);
  var report=ok(req("admin","GET",history,null),200);assertThat(report.path("packs").size()).isGreaterThan(0);
  assertThat(report.toString()).contains("Settled","PACK SETTLE","CLOSING CLOSED","Received");
  for(var pack:report.path("packs")){assertThat(pack.path("timeline").size()).isGreaterThan(0);assertThat(pack.path("ticketsRemaining").asInt()).isGreaterThanOrEqualTo(0);}
  assertThat(ok(req("admin","GET","/access/stores/"+second+"/lottery-pack-history",null),200).path("packs").isEmpty()).isTrue();
 }

 @Test @Order(999) void subpagePermissionsAreIndependentAndEnforced() throws Exception {
  long role=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  String base=access()+"/role-permissions";
  assertThat(ok(req("manager","GET",access()+"/context",null),200).path("roles").toString()).contains("MANAGER");
  assertThat(ok(req("cashier","GET",access()+"/context",null),200).path("roles").toString()).contains("CASHIER");
  var catalogue=ok(req("admin","GET",base,null),200);
  assertThat(catalogue.path("pages").size()).isEqualTo(60);
  assertThat(catalogue.path("sections").size()).isEqualTo(12);
  Set<String> visible=new HashSet<>();catalogue.path("actions").forEach(a->visible.add(a.path("code").asText()));
  assertThat(visible).contains("GROCERY_PAGE_INVOICES","GAS_PAGE_DELIVERY","LOTTERY_PAGE_ACTIVATE").doesNotContain("STORE_SETTINGS_VIEW","STORE_SETTINGS_EDIT","LOTTERY_RECEIVE_DELIVERY","GROCERY_CREATE_PO","GAS_RECORD_DELIVERY");
  db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed) VALUES (?,?,'GAS_VIEW_DELIVERIES',true) ON CONFLICT(dgt_id,role_type_id,permission_code) DO UPDATE SET allowed=true",store,role);
  ok(req("manager","GET",access()+"/gas-deliveries",null),200);
  var change=Map.of("roleTypeId",role,"code","GAS_PAGE_DELIVERY","allowed",false,"version","0");
  ok(req("manager","PUT",base,change),403);ok(req("other","PUT",base,change),403);
  ok(req("admin","PUT",base,change),200);
  assertThat(ok(req("manager","GET",access()+"/context",null),200).path("pages").path("GAS_PAGE_DELIVERY").asBoolean()).isFalse();
  ok(req("manager","GET",access()+"/gas-deliveries",null),403);
  assertThat(ok(req("manager","GET",access()+"/context",null),200).path("pages").path("GAS_PAGE_TANK_REPORT").asBoolean()).isTrue();
  ok(req("admin","GET",access()+"/gas-deliveries",null),200);
  ok(req("admin","PUT",base,change),409);
  String version=db.queryForObject("SELECT xmin::text FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code='GAS_PAGE_DELIVERY'",String.class,store,role);
  var enable=Map.of("roleTypeId",role,"code","GAS_PAGE_DELIVERY","allowed",true,"version",version);
  var stale=Map.of("roleTypeId",role,"code","GAS_PAGE_TANK_REPORT","allowed",false,"version","invalid");
  ok(req("admin","PUT",base+"/batch",Map.of("changes",List.of(enable,stale))),409);
  ok(req("manager","GET",access()+"/gas-deliveries",null),403);
  ok(req("admin","PUT",base+"/batch",Map.of("changes",List.of(enable))),200);
  ok(req("manager","GET",access()+"/gas-deliveries",null),200);
  // Enabling a page must not grant manager-only actions to a cashier.
  long cashier=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER'",Long.class);
  ok(req("admin","PUT",base,Map.of("roleTypeId",cashier,"code","GAS_PAGE_TANK_REPORT","allowed",true,"version","0")),200);
  ok(req("cashier","GET",access()+"/gas-prices",null),403);
  ok(req("other","GET",access()+"/context",null),403);
  // A hidden entry form cannot be opened by calling its write endpoint directly.
  ok(req("admin","PUT",base,Map.of("roleTypeId",role,"code","GAS_PAGE_DELIVERY_ADD","allowed",false,"version","0")),200);
  ok(req("manager","GET",access()+"/gas-deliveries",null),200);
  ok(req("manager","POST",access()+"/gas-deliveries",Map.of()),403);
  var rights=ok(req("manager","GET",access()+"/context",null),200).path("pages");
  assertThat(rights.has("GAS_PAGE_DASHBOARD")).isFalse();
  assertThat(rights.path("GAS_PAGE_DELIVERY_ADD").asBoolean()).isFalse();
  // Hide a tabbed parent when all of its children are disabled.
  for(String code:List.of("GROCERY_PAGE_INVOICES_EDIT","GROCERY_PAGE_INVOICES_APPROVALS","GROCERY_PAGE_INVOICES_VIEW"))
   ok(req("admin","PUT",base,Map.of("roleTypeId",role,"code",code,"allowed",false,"version","0")),200);
  assertThat(ok(req("manager","GET",access()+"/context",null),200).path("pages").path("GROCERY_PAGE_INVOICES").asBoolean()).isFalse();
  ok(req("manager","GET",access()+"/invoice-entry",null),403);

 }

 @Test @Order(1000) void parentModulesCascadeAndRestoreSubpagePreferences() throws Exception {
  long role=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  String base=access()+"/role-permissions";
  for(String module:List.of("GROCERY","GAS","LOTTERY")){
   String code="MODULE_"+module;
   var disable=Map.of("roleTypeId",role,"code",code,"allowed",false,"version","0");
   ok(req("manager","PUT",base,disable),403);
   ok(req("admin","PUT",base,disable),200);
   var rights=ok(req("manager","GET",access()+"/context",null),200).path("pages");
   assertThat(rights.path(code).asBoolean()).isFalse();
   rights.properties().forEach(e->{if(e.getKey().startsWith(module+"_PAGE_"))assertThat(e.getValue().asBoolean()).as(e.getKey()).isFalse();});
   String endpoint=switch(module){case "GROCERY" -> "purchase-orders";case "GAS" -> "gas-deliveries";default -> "lottery-deliveries";};
   ok(req("manager","GET",access()+"/"+endpoint,null),403);
   ok(req("admin","GET",access()+"/"+endpoint,null),200);
   assertThat(ok(req("cashier","GET",access()+"/context",null),200).path("pages").path(code).asBoolean()).isTrue();
   ok(req("admin","PUT",base,disable),409);
   String version=db.queryForObject("SELECT xmin::text FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code=?",String.class,store,role,code);
   ok(req("admin","PUT",base,Map.of("roleTypeId",role,"code",code,"allowed",true,"version",version)),200);
  }
  var restored=ok(req("manager","GET",access()+"/context",null),200).path("pages");
  assertThat(restored.path("GAS_PAGE_DELIVERY").asBoolean()).isTrue();
  assertThat(restored.path("GAS_PAGE_DELIVERY_ADD").asBoolean()).isFalse();
  assertThat(restored.path("GROCERY_PAGE_INVOICES").asBoolean()).isFalse();
 }

 @Test @Order(1001) void employeeOverridesAreIsolatedAndEnforced() throws Exception {
  long role=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='CASHIER'",Long.class);
  var employeeIds=db.queryForList("SELECT employee_id FROM employees WHERE user_id=?",Long.class,users.get("cashier"));
  long employee=employeeIds.isEmpty()?db.queryForObject("INSERT INTO employees(user_id,first_name,last_name,hire_date,employee_type) VALUES (?,'Override','Cashier','2020-01-01','FULL_TIME') RETURNING employee_id",Long.class,users.get("cashier")):employeeIds.getFirst();
  for(String target:List.of(store,second)){
   db.update("INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id) VALUES (?,?,false,'2020-01-01',?) ON CONFLICT DO NOTHING",employee,target,role);
   db.update("INSERT INTO user_roles(user_id,role_type_id,dgt_id) VALUES (?,?,?) ON CONFLICT DO NOTHING",users.get("cashier"),role,target);
  }
  long peer=db.queryForObject("INSERT INTO users(dgt_id,employee_id,first_name,last_name,email,password_hash) VALUES (?,?,'Peer','Cashier',?,?) RETURNING user_id",Long.class,store,"peer-"+tag,"peer-"+tag+"@example.test",new BCryptPasswordEncoder(4).encode(password));
  db.update("INSERT INTO user_roles(user_id,role_type_id,dgt_id) VALUES (?,?,?)",peer,role,store);
  db.update("UPDATE store_role_permissions SET allowed=false WHERE dgt_id=? AND role_type_id=? AND permission_code='MODULE_WORKWEEK'",store,role);
  String path=access()+"/employee-access/"+employee+"/permissions";
  var initial=ok(req("admin","GET",path,null),200);
  var body=Map.of("version",initial.path("version").asText(),"overrides",Map.of("MODULE_WORKWEEK",true));
  ok(req("cashier","PUT",path,body),403);ok(req("other","PUT",path,body),403);
  ok(req("cashier","GET",access()+"/workforce",null),403);
  var saved=ok(req("admin","PUT",path,body),200);
  assertThat(saved.path("effective").path("MODULE_WORKWEEK").asBoolean()).isTrue();
  assertThat(saved.path("roleDefaults").path("MODULE_WORKWEEK").asBoolean()).isFalse();
  ok(req("cashier","GET",access()+"/workforce",null),200);
  ok(req("peer","GET",access()+"/workforce",null),403);
  ok(req("cashier","GET","/access/stores/"+second+"/workforce",null),403);
  ok(req("cashier","GET",access()+"/employees",null),403);
  ok(req("admin","PUT",path,body),409);
  ok(req("admin","PUT",path,Map.of("version",saved.path("version").asText(),"overrides",Map.of("UNKNOWN",true))),400);
  saved=ok(req("admin","PUT",path,Map.of("version",saved.path("version").asText(),"overrides",Map.of("MODULE_WORKWEEK",true,"MODULE_LOTTERY",false,"LOTTERY_PAGE_RECEIVED",true))),200);
  assertThat(saved.path("effective").path("LOTTERY_PAGE_RECEIVED").asBoolean()).isFalse();
  ok(req("cashier","GET",access()+"/lottery-deliveries",null),403);
  var reset=ok(req("admin","PUT",path,Map.of("version",saved.path("version").asText(),"overrides",Map.of())),200);
  assertThat(reset.path("effective").path("MODULE_WORKWEEK").asBoolean()).isFalse();
  assertThat(reset.path("effective").path("LOTTERY_PAGE_RECEIVED").asBoolean()).isTrue();
  ok(req("cashier","GET",access()+"/workforce",null),403);
 }

 @Test @Order(1002) void remainingModulesExposeAndEnforcePageAndTabPermissions() throws Exception {
  long role=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  String matrix=access()+"/role-permissions";
  var catalogue=ok(req("admin","GET",matrix,null),200);
  Set<String> groups=new HashSet<>();catalogue.path("pages").forEach(p->groups.add(p.path("group").asText()));
  assertThat(groups).hasSize(12).contains("Payroll Permissions","Banking Management Permissions","Workweek Permissions","Financial and Payment Services Permissions");
  for(String code:List.of("TENDERS_PAGE_CREDIT_CARD_SETTINGS","PRICE_BOOK_PAGE_DISCOUNTS_REASONS","WORKWEEK_PAGE_WEEK_SCHEDULE_AVAILABILITY"))
   ok(req("admin","PUT",matrix,Map.of("roleTypeId",role,"code",code,"allowed",false,"version","0")),200);
  var rights=ok(req("manager","GET",access()+"/context",null),200).path("pages");
  assertThat(rights.path("TENDERS_PAGE_CREDIT_CARD").asBoolean()).isTrue();
  assertThat(rights.path("TENDERS_PAGE_CREDIT_CARD_SETTINGS").asBoolean()).isFalse();
  ok(req("manager","PUT",access()+"/credit-card/settings",Map.of()),403);
  ok(req("manager","POST",access()+"/discounts",Map.of()),403);
  ok(req("admin","PUT",matrix,Map.of("roleTypeId",role,"code","TENDERS_PAGE_CREDIT_CARD","allowed",false,"version","0")),200);
  ok(req("manager","GET",access()+"/credit-card",null),403);
  rights=ok(req("manager","GET",access()+"/context",null),200).path("pages");
  assertThat(rights.path("TENDERS_PAGE_CREDIT_CARD_SETTLEMENT").asBoolean()).isFalse();
  assertThat(rights.path("TENDERS_PAGE_EBT_FOODSTAMPS").asBoolean()).isTrue();
  assertThat(rights.path("PAYROLL_PAGE_RUN_PAYROLL").asBoolean()).isFalse();
 }

 @Test @Order(1003) void adminCreatesChildStoreWithoutSignup() throws Exception {
  String endpoint=access()+"/manage-stores",key=UUID.randomUUID().toString();
  var original=db.queryForMap("SELECT legal_business_name,tax_id FROM stores WHERE dgt_id=?",store);
  var body=new LinkedHashMap<String,Object>();body.put("parentStoreId",store);body.put("storeId","child-"+tag);body.put("storeName","Child "+tag);body.put("legalBusinessName",original.get("legal_business_name"));body.put("taxId",original.get("tax_id"));body.put("licenseNumber","child-license-"+tag);body.put("timezone","America/New_York");body.put("address","123 Local Test Street");body.put("phone","");body.put("email","child@example.test");
  ok(req("manager","GET",endpoint,null),403);ok(req("cashier","POST",endpoint,body),403);ok(req("other","POST",endpoint,body),403);
  var foreignParent=new LinkedHashMap<>(body);foreignParent.put("parentStoreId",foreign);ok(req("admin","POST",endpoint,foreignParent),403);
  var invalid=new LinkedHashMap<>(body);invalid.put("timezone","Invalid/Zone");ok(req("admin","POST",endpoint,invalid),400);
  var created=ok(call("admin","POST",endpoint,body,null,key),201);String child=created.path("dgtId").asText();
  assertThat(child).startsWith("DGT-");
  assertThat(ok(call("admin","POST",endpoint,body,null,key),201).path("dgtId").asText()).isEqualTo(child);
  var changed=new LinkedHashMap<>(body);changed.put("storeName","Different");ok(call("admin","POST",endpoint,changed,null,key),409);
  ok(req("admin","POST",endpoint,body),409);
  assertThat(db.queryForObject("SELECT parent_store_dgt_id FROM stores WHERE dgt_id=?",String.class,child)).isEqualTo(store);
  assertThat(db.queryForObject("SELECT company_id FROM stores WHERE dgt_id=?",Long.class,child)).isEqualTo(company);
  assertThat(db.queryForObject("SELECT count(*) FROM store_business_hours WHERE dgt_id=? AND status='UNSET'",Integer.class,child)).isEqualTo(7);
  assertThat(db.queryForObject("SELECT count(*) FROM store_role_permissions WHERE dgt_id=?",Integer.class,child)).isEqualTo(db.queryForObject("SELECT count(*) FROM store_role_permissions WHERE dgt_id=?",Integer.class,store));
  assertThat(db.queryForObject("SELECT count(*) FROM user_roles WHERE dgt_id=?",Integer.class,child)).isZero();
  assertThat(db.queryForObject("SELECT count(*) FROM employee_store_assignments WHERE dgt_id=?",Integer.class,child)).isZero();
  assertThat(ok(req("admin","GET","/access/stores",null),200).toString()).contains(child);
  assertThat(ok(req("manager","GET","/access/stores",null),200).toString()).doesNotContain(child);
  assertThat(ok(req("admin","GET",endpoint,null),200).toString()).contains(child,"parent_store_name");
  ok(req("admin","GET","/stores/"+child+"/settings",null),200);
  ok(req("admin","GET","/access/stores/"+child+"/role-permissions",null),200);
  ok(req("other","GET","/access/stores/"+child+"/manage-stores",null),403);
  long role=db.queryForObject("SELECT role_type_id FROM role_types WHERE role_type_name='MANAGER'",Long.class);
  db.update("UPDATE store_role_permissions SET allowed=false WHERE dgt_id=? AND role_type_id=? AND permission_code='MODULE_GROCERY'",child,role);
  assertThat(db.queryForObject("SELECT allowed FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code='MODULE_GROCERY'",Boolean.class,store,role)).isTrue();
 }

}
