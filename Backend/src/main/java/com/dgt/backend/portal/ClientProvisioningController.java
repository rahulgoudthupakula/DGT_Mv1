package com.dgt.backend.portal;
import java.util.*;import java.time.ZoneId;
import org.springframework.web.bind.annotation.*;import org.springframework.transaction.annotation.Transactional;import org.springframework.http.HttpStatus;import org.springframework.web.server.ResponseStatusException;import org.springframework.jdbc.core.JdbcTemplate;import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;import tools.jackson.databind.ObjectMapper;import com.dgt.backend.common.entity.Rows;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController @RequestMapping("/api/v1/internal/client-handling")
public class ClientProvisioningController {
 private final PortalBridge bridge;private final JdbcTemplate db;private final ObjectMapper json;
 public ClientProvisioningController(PortalBridge bridge,JdbcTemplate db,ObjectMapper json){this.bridge=bridge;this.db=db;this.json=json;}
 private static String text(String value,int max){if(value==null||value.isBlank()||value.length()>max)throw new ResponseStatusException(HttpStatus.BAD_REQUEST);return value.trim();}
 @GetMapping("/clients") public Object clients(@RequestHeader(value="X-DGT-Bridge-Key",required=false) String key){bridge.require(key);return db.queryForList("SELECT c.company_id,c.company_name,c.is_active,s.dgt_id,s.store_name,s.parent_store_dgt_id FROM companies c LEFT JOIN stores s USING(company_id) ORDER BY c.company_name,s.store_name LIMIT 1000").stream().map(Rows::normalize).toList();}
 public record Input(UUID requestId,String firstName,String lastName,String email,String phone,String businessName,String storeName,String storeCode,String taxId,String licenseNumber,String timezone,String address){}
 @PostMapping("/provision") @Transactional public Object provision(@RequestHeader(value="X-DGT-Bridge-Key",required=false) String key,@RequestBody Input raw){
  bridge.require(key);if(raw.requestId()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
  Input in=new Input(raw.requestId(),text(raw.firstName(),100),text(raw.lastName(),100),text(raw.email(),254).toLowerCase(Locale.ROOT),text(raw.phone(),40),text(raw.businessName(),200),text(raw.storeName(),150),text(raw.storeCode(),50),text(raw.taxId(),50),text(raw.licenseNumber(),100),text(raw.timezone(),80),text(raw.address(),500));
  if(!ZoneId.getAvailableZoneIds().contains(in.timezone())||!in.email().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
  // Serialize provisioning retries across both databases without distributed transactions.
  db.execute("SELECT pg_advisory_xact_lock(837452910)");String payload=json.writeValueAsString(in);
  var prior=db.queryForList("SELECT * FROM client_onboarding_provisions WHERE request_id=?",in.requestId());if(!prior.isEmpty()){var old=prior.getFirst();if(!json.readTree(old.get("request_payload").toString()).equals(json.readTree(payload)))throw new ResponseStatusException(HttpStatus.CONFLICT);return Map.of("storeId",old.get("dgt_id"),"userId",old.get("user_id"));}
  if(Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM users WHERE lower(email)=?) OR EXISTS(SELECT 1 FROM stores WHERE store_id=? OR license_number=?)",Boolean.class,in.email(),in.storeCode(),in.licenseNumber())))throw new ResponseStatusException(HttpStatus.CONFLICT);
  long company=db.queryForObject("INSERT INTO companies(company_name) VALUES (?) RETURNING company_id",Long.class,in.businessName());
  String store=db.queryForObject("INSERT INTO stores(store_id,store_name,legal_business_name,tax_id,license_number,timezone,company_id) VALUES (?,?,?,?,?,?,?) RETURNING dgt_id",String.class,in.storeCode(),in.storeName(),in.businessName(),in.taxId(),in.licenseNumber(),in.timezone(),company);
  db.update("UPDATE companies SET primary_store_dgt_id=? WHERE company_id=?",store,company);
  db.update("INSERT INTO store_contact_info(dgt_id,store_name,address,phone_number,email) VALUES (?,?,?,?,?)",store,in.storeName(),in.address(),in.phone().replaceAll("[^+\\d]",""),in.email());
  for(String day:List.of("MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"))db.update("INSERT INTO store_business_hours(dgt_id,day_of_week,status) VALUES (?,?,'UNSET')",store,day);
  long user=db.queryForObject("INSERT INTO users(dgt_id,employee_id,first_name,last_name,email,password_hash,account_status) VALUES (?,?,?,?,?,?,'INACTIVE') RETURNING user_id",Long.class,store,"ADMIN-"+UUID.randomUUID(),in.firstName(),in.lastName(),in.email(),new BCryptPasswordEncoder(12).encode(UUID.randomUUID().toString()));
  db.update("INSERT INTO company_admins(company_id,user_id) VALUES (?,?)",company,user);
  db.update("INSERT INTO client_onboarding_provisions(request_id,company_id,dgt_id,user_id,request_payload) VALUES (?,?,?,?,?::jsonb)",in.requestId(),company,store,user,payload);return Map.of("storeId",store,"userId",user);
 }
 public record Activate(UUID requestId,String password){}
 @PostMapping("/activate") @Transactional public Object activate(@RequestHeader(value="X-DGT-Bridge-Key",required=false) String key,@RequestBody Activate in){bridge.require(key);if(in.password()==null||in.password().length()<12||in.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)throw new ResponseStatusException(HttpStatus.BAD_REQUEST);var list=db.queryForList("SELECT * FROM client_onboarding_provisions WHERE request_id=? FOR UPDATE",in.requestId());if(list.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);var r=list.getFirst();if(r.get("activated_at")!=null)return Map.of("activated",true);if(db.update("UPDATE users SET password_hash=?,account_status='ACTIVE',updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND account_status='INACTIVE'",new BCryptPasswordEncoder(12).encode(in.password()),r.get("user_id"))!=1)throw new ResponseStatusException(HttpStatus.CONFLICT);db.update("UPDATE client_onboarding_provisions SET activated_at=CURRENT_TIMESTAMP WHERE request_id=?",in.requestId());return Map.of("activated",true);}
}
