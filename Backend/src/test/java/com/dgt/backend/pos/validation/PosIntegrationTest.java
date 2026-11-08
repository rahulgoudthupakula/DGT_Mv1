package com.dgt.backend.pos.validation;
import com.dgt.backend.pos.dto.PosTransaction;
import com.dgt.backend.pos.security.PosIdentity;
import com.dgt.backend.pos.security.PosSecurity;
import com.dgt.backend.pos.service.PosIngestionService;
import java.util.*;
import java.nio.file.*;
import java.sql.*;
import java.net.*;
import java.net.http.*;
import java.math.BigDecimal;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.beans.factory.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

/** Uses a unique temporary schema on the existing LOCAL test database only. */
@EnabledIfEnvironmentVariable(named="DGT_POS_TESTS",matches="true")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"app.environment=testing","app.pos.simulator-enabled=true","app.profile.enabled=true","logging.level.root=WARN","debug=false","spring.flyway.enabled=false"})
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PosIntegrationTest {
 static final String SCHEMA="pos_test_"+UUID.randomUUID().toString().replace("-","");
 static final String URL="jdbc:postgresql://127.0.0.1:55439/dgt_test";
 static final String USER="dgt_test",PASSWORD="only-test-password";
 @DynamicPropertySource static void database(DynamicPropertyRegistry r)throws Exception{
  Path folder=Files.createTempDirectory("dgt-pos-migrations-");
  try(var files=Files.list(Path.of("src/main/resources/db/migration"))){for(Path file:files.filter(p->p.toString().endsWith(".sql")).toList())Files.writeString(folder.resolve(file.getFileName()),Files.readString(file).replace("public.",SCHEMA+"."));}
  try(var c=DriverManager.getConnection(URL,USER,PASSWORD);var s=c.createStatement()){s.execute("CREATE SCHEMA "+SCHEMA);}
  org.flywaydb.core.Flyway.configure().dataSource(URL+"?currentSchema="+SCHEMA,USER,PASSWORD).schemas(SCHEMA).defaultSchema(SCHEMA).locations("filesystem:"+folder).load().migrate();
  r.add("spring.datasource.url",()->URL+"?currentSchema="+SCHEMA);r.add("spring.datasource.username",()->USER);r.add("spring.datasource.password",()->PASSWORD);
 }
 @Autowired JdbcTemplate db;@Autowired PosIngestionService service;@Autowired ObjectMapper json;@Value("${local.server.port}") int port;
 String store,other,key="test-connector-key-abcdefghijklmnopqrstuvwxyz",adminEmail,adminPassword="local-testing-password",adminToken="local-admin-session-token-0123456789";long product,terminal,employee,tender;PosIdentity connector;
 @BeforeAll void fixture(){
  long company=db.queryForObject("INSERT INTO companies(company_name) VALUES ('POS test') RETURNING company_id",Long.class);
  store=store(company);other=store(company);
  terminal=db.queryForObject("INSERT INTO pos_terminals(store_id,terminal_code) VALUES (?,'SIM-R') RETURNING terminal_id",Long.class,store);
  employee=db.queryForObject("INSERT INTO employees(hire_date,employee_type,first_name,last_name) VALUES ('2020-01-01','FULL_TIME','POS','Test') RETURNING employee_id",Long.class);
  db.update("INSERT INTO employee_store_assignments(employee_id,dgt_id,effective_from) VALUES (?,?,'2020-01-01')",employee,store);
  long dept=db.queryForObject("SELECT department_id FROM departments LIMIT 1",Long.class);
  long sd=db.queryForObject("INSERT INTO store_departments(dgt_id,department_id,source_type,store_department_name) VALUES (?,?,'DEFAULT','POS') RETURNING store_department_id",Long.class,store,dept);
  long sub=db.queryForObject("INSERT INTO store_sub_departments(dgt_id,store_department_id,store_sub_department_name) VALUES (?,?,'POS') RETURNING store_sub_department_id",Long.class,store,sd);
  product=db.queryForObject("INSERT INTO products(dgt_id,store_sub_department_id,product_name,product_sku) VALUES (?,?,'POS item','POS-ITEM') RETURNING product_id",Long.class,store,sub);
  db.update("INSERT INTO product_barcodes(dgt_id,product_id,product_barcode_type,product_barcode_value) VALUES (?,?,'UPC','00001')",store,product);
  tender=db.queryForObject("INSERT INTO tender_types(tender_code,tender_name) VALUES ('POS-CASH','POS Cash') RETURNING tender_type_id",Long.class);
  connector=new PosIdentity(UUID.randomUUID(),store);db.update("INSERT INTO pos_connectors(connector_id,dgt_id,credential_hash) VALUES (?,?,?)",connector.id(),store,PosSecurity.hash(key));
  map("REGISTER","R",terminal);map("CASHIER","C",employee);map("TENDER","CASH",tender);
  adminEmail="pos-admin@example.test";long uid=db.queryForObject("INSERT INTO users(dgt_id,employee_id,first_name,last_name,email,password_hash) VALUES (?,'POSADMIN','POS','Admin',?,?) RETURNING user_id",Long.class,store,adminEmail,new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(4).encode(adminPassword));db.update("INSERT INTO company_admins(company_id,user_id) VALUES (?,?)",company,uid);
  String hash=db.queryForObject("SELECT password_hash FROM users WHERE user_id=?",String.class,uid);db.update("INSERT INTO user_sessions(session_id,user_id,token_hash,credential_fingerprint,ip_address,user_agent,expires_at) VALUES (?,?,?,?,?,?,now()+interval '1 hour')",UUID.randomUUID(),uid,PosSecurity.hash(adminToken),PosSecurity.hash(adminEmail+":"+hash),"127.0.0.1","Test");
 }
 String store(long company){String u=UUID.randomUUID().toString();return db.queryForObject("INSERT INTO stores(store_id,store_name,legal_business_name,tax_id,license_number,company_id,timezone) VALUES (?,?,?,?,?,?,'America/New_York') RETURNING dgt_id",String.class,u,u,u,u,u,company);}
 void map(String kind,String code,long id){db.update("INSERT INTO pos_mappings VALUES (?,?,?,?) ON CONFLICT(connector_id,kind,source_code) DO UPDATE SET target_id=excluded.target_id",connector.id(),kind,code,id);}
 PosTransaction tx(String type){var t=PosValidationTest.fixture(type);return new PosTransaction(t.version(),store,t.sourceSystem(),UUID.randomUUID().toString(),t.registerCode(),t.cashierCode(),UUID.randomUUID().toString(),t.transactionType(),t.saleStatus(),t.saleDateTime(),null,t.subtotal(),t.taxableAmount(),t.taxAmount(),t.discountAmount(),t.totalAmount(),t.totalItems(),t.items(),t.payments());}
 HttpResponse<String> call(String path,String credential,Object body)throws Exception{var b=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path)).header("Authorization",credential);if(body!=null)b.header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));return HttpClient.newHttpClient().send(b.build(),HttpResponse.BodyHandlers.ofString());}
 @Test void transactionTypesAndNoStockMutation(){long before=db.queryForObject("SELECT count(*) FROM inventory",Long.class);for(String type:List.of("SALE","RETURN","REFUND","VOID")){var result=service.ingest(connector,tx(type),false);assertEquals("ACCEPTED",result.outcome());assertNotNull(result.saleId());}assertEquals(before,db.queryForObject("SELECT count(*) FROM inventory",Long.class));}
 @Test void duplicatesAndConflict()throws Exception{var t=tx("SALE");var first=service.ingest(connector,t,false);assertEquals(first.saleId(),service.ingest(connector,t,false).saleId());var node=json.valueToTree(t);((tools.jackson.databind.node.ObjectNode)node).put("receiptNo","changed");assertThrows(org.springframework.web.server.ResponseStatusException.class,()->service.ingest(connector,json.treeToValue(node,PosTransaction.class),false));}
 @Test void simultaneousDuplicates()throws Exception{var t=tx("SALE");try(var pool=Executors.newVirtualThreadPerTaskExecutor()){var jobs=List.<Callable<PosIngestionService.Result>>of(()->service.ingest(connector,t,false),()->service.ingest(connector,t,false));var results=pool.invokeAll(jobs);assertEquals(results.get(0).get().saleId(),results.get(1).get().saleId());}}
 @Test void unknownProductHeldThenResolved(){var t=tx("SALE");var i=t.items().getFirst();var changed=new PosTransaction.Item("UNKNOWN",null,i.quantity(),i.catalogPrice(),i.unitPrice(),i.grossAmount(),i.discountAmount(),i.taxableAmount(),i.taxAmount(),i.lineTotal());var value=new PosTransaction(t.version(),store,t.sourceSystem(),t.sourceTransactionId(),"R","C",t.receiptNo(),"SALE","COMPLETED",t.saleDateTime(),null,t.subtotal(),t.taxableAmount(),t.taxAmount(),t.discountAmount(),t.totalAmount(),1,List.of(changed),t.payments());assertEquals("HELD",service.ingest(connector,value,false).outcome());map("PRODUCT","UNKNOWN",product);assertEquals("ACCEPTED",service.ingest(connector,value,true).outcome());}
 @Test void invalidMappingHeld(){db.update("UPDATE pos_mappings SET target_id=-1 WHERE connector_id=? AND kind='REGISTER'",connector.id());try{assertEquals("HELD",service.ingest(connector,tx("SALE"),false).outcome());}finally{map("REGISTER","R",terminal);}}
 @Test void unknownTenderHeld(){db.update("DELETE FROM pos_mappings WHERE connector_id=? AND kind='TENDER'",connector.id());try{assertEquals("HELD",service.ingest(connector,tx("SALE"),false).outcome());}finally{map("TENDER","CASH",tender);}}
 @Test void authenticationAndCrossStore()throws Exception{
  assertEquals(401,call("/pos/sales","Bearer invalid",tx("SALE")).statusCode());
  assertTrue(Set.of(401,403).contains(call("/access/stores/"+store+"/pos","Bearer "+key,null).statusCode()));
  var body=json.valueToTree(tx("SALE"));((tools.jackson.databind.node.ObjectNode)body).put("dgtId",other);assertEquals(403,call("/pos/sales","Bearer "+key,body).statusCode());
  ((tools.jackson.databind.node.ObjectNode)body).put("dgtId",store);((tools.jackson.databind.node.ObjectNode)body).put("cardNumber","not-allowed");assertEquals(422,call("/pos/sales","Bearer "+key,body).statusCode());
  db.update("UPDATE pos_connectors SET active=false WHERE connector_id=?",connector.id());try{assertEquals(401,call("/pos/configuration","Bearer "+key,null).statusCode());}finally{db.update("UPDATE pos_connectors SET active=true WHERE connector_id=?",connector.id());}
 }
 @Test void itemAndPaymentFailuresRollback(){for(String table:List.of("sales_items","sale_payments")){var t=tx("SALE");long before=db.queryForObject("SELECT count(*) FROM sales",Long.class);db.execute("CREATE FUNCTION fail_pos_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$");db.execute("CREATE TRIGGER fail_pos BEFORE INSERT ON "+table+" FOR EACH ROW EXECUTE FUNCTION fail_pos_insert()");try{assertThrows(Exception.class,()->service.ingest(connector,t,false));assertEquals(before,db.queryForObject("SELECT count(*) FROM sales",Long.class));assertEquals(0,db.queryForObject("SELECT count(*) FROM pos_ingestions WHERE source_transaction_id=?",Integer.class,t.sourceTransactionId()));}finally{db.execute("DROP TRIGGER fail_pos ON "+table);db.execute("DROP FUNCTION fail_pos_insert()");}}}
 @Test void multipleItemsFractionalQuantityAndSplitTender(){
  var t=tx("SALE");var i=new PosTransaction.Item(null,"00001",new BigDecimal("0.500"),new BigDecimal("2.00"),new BigDecimal("2.00"),new BigDecimal("1.00"),BigDecimal.ZERO,BigDecimal.ZERO,BigDecimal.ZERO,new BigDecimal("1.00"));
  map("TENDER","CREDIT",tender);
  var value=new PosTransaction(1,store,t.sourceSystem(),t.sourceTransactionId(),"R","C",t.receiptNo(),"SALE","COMPLETED",t.saleDateTime(),null,new BigDecimal("2.00"),BigDecimal.ZERO,BigDecimal.ZERO,BigDecimal.ZERO,new BigDecimal("2.00"),2,List.of(i,i),List.of(new PosTransaction.Payment("CASH",new BigDecimal("1.00"),"COMPLETED",null),new PosTransaction.Payment("CREDIT",new BigDecimal("1.00"),"COMPLETED","VISA")));
  var result=service.ingest(connector,value,false);assertEquals("ACCEPTED",result.outcome());assertEquals(2,db.queryForObject("SELECT count(*) FROM sales_items WHERE sale_id=?",Integer.class,result.saleId()));assertEquals(2,db.queryForObject("SELECT count(*) FROM sale_payments WHERE sale_id=?",Integer.class,result.saleId()));
 }
 @Test void differentStoresCanUseSameSourceIdentity(){
  var t=tx("SALE");var result=service.ingest(connector,t,false);assertEquals("ACCEPTED",result.outcome());
  var c=new PosIdentity(UUID.randomUUID(),other);db.update("INSERT INTO pos_connectors(connector_id,dgt_id,credential_hash) VALUES (?,?,?)",c.id(),other,PosSecurity.hash(UUID.randomUUID().toString()));
  var second=new PosTransaction(1,other,t.sourceSystem(),t.sourceTransactionId(),"R","C",t.receiptNo(),t.transactionType(),t.saleStatus(),t.saleDateTime(),null,t.subtotal(),t.taxableAmount(),t.taxAmount(),t.discountAmount(),t.totalAmount(),t.totalItems(),t.items(),t.payments());
  var held=service.ingest(c,second,false);assertEquals("HELD",held.outcome());assertNotEquals(result.ingestionId(),held.ingestionId());
 }
 @Test void receiptCollisionIsHeld(){var t=tx("SALE");service.ingest(connector,t,false);var second=new PosTransaction(1,store,t.sourceSystem(),UUID.randomUUID().toString(),"R","C",t.receiptNo(),t.transactionType(),t.saleStatus(),t.saleDateTime(),null,t.subtotal(),t.taxableAmount(),t.taxAmount(),t.discountAmount(),t.totalAmount(),t.totalItems(),t.items(),t.payments());assertEquals("HELD",service.ingest(connector,second,false).outcome());}
 @Test void adminSettingsAndConnectorHeartbeat()throws Exception{
  String basic="Bearer "+adminToken;
  assertEquals(200,call("/access/stores/"+store+"/pos",basic,null).statusCode());assertEquals(200,call("/access/stores/"+store+"/pos/targets",basic,null).statusCode());
  assertEquals(200,call("/pos/heartbeat","Bearer "+key,Map.of()).statusCode());assertNotNull(db.queryForObject("SELECT heartbeat_at FROM pos_connectors WHERE connector_id=?",java.sql.Timestamp.class,connector.id()));
 }
 @Test @EnabledIfEnvironmentVariable(named="DGT_CONNECTOR_JAR",matches=".+") void independentConnectorEndToEnd()throws Exception{
  map("REGISTER","SIM-REGISTER-1",terminal);map("CASHIER","SIM-CASHIER-1",employee);map("PRODUCT","SIM-COLA",product);map("PRODUCT","SIM-CHIPS",product);map("TENDER","SIM-CREDIT",tender);
  Path folder=Files.createTempDirectory("pos-connector-e2e-");Path config=folder.resolve("connector.properties");
  Files.writeString(config,"environment=testing\napiUrl=http://127.0.0.1:"+port+"/api/v1/pos\nstoreId="+store+"\ncredential="+key+"\nqueueFile="+folder.resolve("queue.sqlite").toString().replace("\\","/")+"\n");
  long before=db.queryForObject("SELECT count(*) FROM sales",Long.class);
  try{for(String command:List.of("simulate","sync","sync")){
   var process=new ProcessBuilder(Path.of(System.getProperty("java.home"),"bin","java").toString(),"-jar",System.getenv("DGT_CONNECTOR_JAR"),config.toString(),command).redirectErrorStream(true).start();
   String output=new String(process.getInputStream().readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);assertEquals(0,process.waitFor(),output);
  }assertEquals(before+1,db.queryForObject("SELECT count(*) FROM sales",Long.class));}finally{Files.deleteIfExists(config);}
 }
 @AfterAll void cleanup()throws Exception{try(var c=DriverManager.getConnection(URL,USER,PASSWORD);var s=c.createStatement()){s.execute("DROP SCHEMA IF EXISTS "+SCHEMA+" CASCADE");}}
}
