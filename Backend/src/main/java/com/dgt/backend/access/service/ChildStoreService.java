package com.dgt.backend.access.service;
import com.dgt.backend.access.repository.ChildStoreRepository;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.dto.CreateChildStoreRequest;

import java.util.*;
import java.time.ZoneId;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import com.dgt.backend.common.entity.Rows;

/**
 * Company-admin API to list company stores and create a child location. Creation includes contact
 * information, unset business hours, a snapshot of parent role preferences and an idempotency
 * receipt in one transaction.
 */

@org.springframework.stereotype.Service

public class ChildStoreService {
 private final ChildStoreRepository repository;
 private final ScopedAccess a;private final ObjectMapper json;
 public ChildStoreService(ScopedAccess a,ObjectMapper json, ChildStoreRepository repository){this.repository=repository;this.a=a;this.json=json;}
 // List locations across the selected store company, not just immediate children.
  public Object list(String store){a.requireAdmin(store);return repository.findCompanyStores(a.company(store)).stream().map(Rows::normalize).toList();}

 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private String text(String value,int max,String label,boolean required){String s=value==null?"":value.trim();if((required&&s.isEmpty())||s.length()>max)throw bad(label+" is required and must be at most "+max+" characters");return s;}
 // Use a UUID retry key: identical retries return the created DGT ID; changed details conflict.
   @Transactional
 public Object create(String store,UUID key,CreateChildStoreRequest raw){
  a.requireAdmin(store);long company=a.company(store);repository.lockCompany(company);a.requireAdmin(store);
  CreateChildStoreRequest in=new CreateChildStoreRequest(text(raw.parentStoreId(),50,"Parent store",true),text(raw.storeId(),50,"Store ID",true),text(raw.storeName(),150,"Store name",true),text(raw.legalBusinessName(),200,"Legal business name",true),text(raw.taxId(),50,"Tax ID",true),text(raw.licenseNumber(),100,"License number",true),text(raw.timezone(),80,"Timezone",true),text(raw.address(),500,"Address",true),text(raw.phone(),20,"Phone",false),text(raw.email(),255,"Email",false).toLowerCase(Locale.ROOT));
  if(!ZoneId.getAvailableZoneIds().contains(in.timezone()))throw bad("Choose a valid timezone");
  if(!in.email().isEmpty()&&!in.email().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))throw bad("Enter a valid store email");
  if(a.company(in.parentStoreId())!=company)throw a.denied();a.requireAdmin(in.parentStoreId());
  String payload=json.writeValueAsString(in);
  // Check the normalized payload and actor before replaying an existing creation result.
  var previous=repository.findCreationRequest(company, key);
  if(!previous.isEmpty()){
   var old=previous.getFirst();if(((Number)old.get("actor_user_id")).longValue()!=a.user()||!json.readTree((String)old.get("request_payload")).equals(json.readTree(payload)))throw new ResponseStatusException(HttpStatus.CONFLICT,"This creation request was already used for different details");
   return Map.of("dgtId",old.get("dgt_id"));
  }
  if(Boolean.TRUE.equals(repository.storeDetailsExist(in.storeId(), in.licenseNumber())))throw new ResponseStatusException(HttpStatus.CONFLICT,"Store ID or license number already exists. Use this location's unique details");
  String id;
  try{id=repository.insertStore(in.storeId(), in.storeName(), in.legalBusinessName(), in.taxId(), in.licenseNumber(), in.timezone(), company, in.parentStoreId());}
  catch(org.springframework.dao.DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Store ID or license number already exists");}
  repository.insertContact(id, in.storeName(), in.address(), in.phone().isEmpty()?null:in.phone(), in.email().isEmpty()?null:in.email());
  // New locations begin with UNSET hours rather than invented opening and closing times.
  for(String day:List.of("MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"))repository.insertBusinessDay(id, day);
  // Snapshot role preferences only; future edits and employee exceptions remain store-specific.
  repository.copyParentPermissions(id, a.user(), in.parentStoreId());
  repository.insertCreationRequest(company, key, a.user(), payload, id);
  a.audit(id,"CHILD_STORE_CREATED",id,json.writeValueAsString(Map.of("parentStoreId",in.parentStoreId())));
  return Map.of("dgtId",id);
 }
}
