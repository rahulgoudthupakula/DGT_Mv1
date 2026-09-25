package com.dgt.backend.access;

import java.util.*;
import java.time.ZoneId;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import com.dgt.backend.common.entity.Rows;

@RestController
@RequestMapping("/api/v1/access/stores/{store}/manage-stores")
public class ChildStoreController {
 private final ScopedAccess a;private final ObjectMapper json;
 public ChildStoreController(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 @GetMapping public Object list(@PathVariable String store){a.requireAdmin(store);return a.db.queryForList("SELECT s.dgt_id,s.store_id,s.store_name,s.timezone,s.parent_store_dgt_id,p.store_name AS parent_store_name,c.address FROM stores s LEFT JOIN stores p ON p.dgt_id=s.parent_store_dgt_id LEFT JOIN LATERAL(SELECT address FROM store_contact_info WHERE dgt_id=s.dgt_id ORDER BY contact_info_id LIMIT 1)c ON true WHERE s.company_id=? ORDER BY s.store_name,s.dgt_id",a.company(store)).stream().map(Rows::normalize).toList();}
 public record Input(String parentStoreId,String storeId,String storeName,String legalBusinessName,String taxId,String licenseNumber,String timezone,String address,String phone,String email){}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private String text(String value,int max,String label,boolean required){String s=value==null?"":value.trim();if((required&&s.isEmpty())||s.length()>max)throw bad(label+" is required and must be at most "+max+" characters");return s;}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) @Transactional
 public Object create(@PathVariable String store,@RequestHeader("Idempotency-Key") UUID key,@RequestBody Input raw){
  a.requireAdmin(store);long company=a.company(store);a.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",company);a.requireAdmin(store);
  Input in=new Input(text(raw.parentStoreId(),50,"Parent store",true),text(raw.storeId(),50,"Store ID",true),text(raw.storeName(),150,"Store name",true),text(raw.legalBusinessName(),200,"Legal business name",true),text(raw.taxId(),50,"Tax ID",true),text(raw.licenseNumber(),100,"License number",true),text(raw.timezone(),80,"Timezone",true),text(raw.address(),500,"Address",true),text(raw.phone(),20,"Phone",false),text(raw.email(),255,"Email",false).toLowerCase(Locale.ROOT));
  if(!ZoneId.getAvailableZoneIds().contains(in.timezone()))throw bad("Choose a valid timezone");
  if(!in.email().isEmpty()&&!in.email().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))throw bad("Enter a valid store email");
  if(a.company(in.parentStoreId())!=company)throw a.denied();a.requireAdmin(in.parentStoreId());
  String payload=json.writeValueAsString(in);
  var previous=a.db.queryForList("SELECT dgt_id,request_payload::text,actor_user_id FROM store_creation_requests WHERE company_id=? AND request_key=?",company,key);
  if(!previous.isEmpty()){
   var old=previous.getFirst();if(((Number)old.get("actor_user_id")).longValue()!=a.user()||!json.readTree((String)old.get("request_payload")).equals(json.readTree(payload)))throw new ResponseStatusException(HttpStatus.CONFLICT,"This creation request was already used for different details");
   return Map.of("dgtId",old.get("dgt_id"));
  }
  if(Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM stores WHERE store_id=? OR license_number=?)",Boolean.class,in.storeId(),in.licenseNumber())))throw new ResponseStatusException(HttpStatus.CONFLICT,"Store ID or license number already exists. Use this location's unique details");
  String id;
  try{id=a.db.queryForObject("INSERT INTO stores(store_id,store_name,legal_business_name,tax_id,license_number,timezone,company_id,parent_store_dgt_id) VALUES (?,?,?,?,?,?,?,?) RETURNING dgt_id",String.class,in.storeId(),in.storeName(),in.legalBusinessName(),in.taxId(),in.licenseNumber(),in.timezone(),company,in.parentStoreId());}
  catch(org.springframework.dao.DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Store ID or license number already exists");}
  a.db.update("INSERT INTO store_contact_info(dgt_id,store_name,address,phone_number,email) VALUES (?,?,?,?,?)",id,in.storeName(),in.address(),in.phone().isEmpty()?null:in.phone(),in.email().isEmpty()?null:in.email());
  for(String day:List.of("MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"))a.db.update("INSERT INTO store_business_hours(dgt_id,day_of_week,status) VALUES (?,?,'UNSET')",id,day);
  // Snapshot role preferences only; future edits and employee exceptions remain store-specific.
  a.db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed,updated_by) SELECT ?,role_type_id,permission_code,allowed,? FROM store_role_permissions WHERE dgt_id=?",id,a.user(),in.parentStoreId());
  a.db.update("INSERT INTO store_creation_requests(company_id,request_key,actor_user_id,request_payload,dgt_id) VALUES (?,?,?,?::jsonb,?)",company,key,a.user(),payload,id);
  a.audit(id,"CHILD_STORE_CREATED",id,json.writeValueAsString(Map.of("parentStoreId",in.parentStoreId())));
  return Map.of("dgtId",id);
 }
}
