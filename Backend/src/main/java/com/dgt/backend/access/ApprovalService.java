package com.dgt.backend.access;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import com.dgt.backend.stores.controller.StoreSettingsController;
import com.dgt.backend.departments.controller.StoreDepartmentAccessController;
@Service
public class ApprovalService {
 private final ObjectProvider<com.dgt.backend.pricebook.PriceBookController> items;
 private final ObjectProvider<com.dgt.backend.pricebook.StorePromotionController> promotions;
 private final ObjectProvider<com.dgt.backend.pricebook.StorePriceGroupController> groups;
 private final ScopedAccess access;private final ObjectMapper json;
 private final ObjectProvider<StoreSettingsController> settings;private final ObjectProvider<StoreDepartmentAccessController> departments;
 public ApprovalService(ScopedAccess access,ObjectMapper json,ObjectProvider<StoreSettingsController> settings,ObjectProvider<StoreDepartmentAccessController> departments,ObjectProvider<com.dgt.backend.pricebook.PriceBookController> items,ObjectProvider<com.dgt.backend.pricebook.StorePromotionController> promotions,ObjectProvider<com.dgt.backend.pricebook.StorePriceGroupController> groups){this.groups=groups;this.promotions=promotions;this.items=items;this.access=access;this.json=json;this.settings=settings;this.departments=departments;}
 private String module(String operation){return switch(operation){case "ITEM_BULK_UPDATE","PRICE_GROUP_SAVE","PRICE_GROUP_DEACTIVATE","PROMOTION_SAVE","PROMOTION_DEACTIVATE","ITEM_CREATE","ITEM_UPDATE"->"PRICE_BOOK";case "STORE_SETTINGS"->"STORE_SETTINGS";case "DEPARTMENT_CREATE","DEPARTMENT_TOGGLE"->"DEPARTMENTS";default->throw access.denied();};}
 private Object apply(String store,String operation,String target,String version,String payload){return switch(operation){case "ITEM_BULK_UPDATE"->items.getObject().applyBulk(store,json.readValue(payload,com.dgt.backend.pricebook.PriceBookController.BulkInput.class));case "PRICE_GROUP_SAVE"->groups.getObject().apply(store,target,version,json.readValue(payload,com.dgt.backend.pricebook.StorePriceGroupController.Input.class));case "PRICE_GROUP_DEACTIVATE"->groups.getObject().applyDeactivate(store,target,version);case "PROMOTION_SAVE"->promotions.getObject().apply(store,target,version,json.readValue(payload,com.dgt.backend.pricebook.StorePromotionController.Input.class));case "PROMOTION_DEACTIVATE"->promotions.getObject().applyDeactivate(store,target,version);case "ITEM_CREATE","ITEM_UPDATE"->items.getObject().apply(store,target,version,json.readValue(payload,com.dgt.backend.pricebook.PriceBookController.Input.class));case "STORE_SETTINGS"->settings.getObject().apply(store,version,json.readValue(payload,StoreSettingsController.Update.class));case "DEPARTMENT_CREATE"->departments.getObject().applyCreate(store,json.readValue(payload,StoreDepartmentAccessController.Create.class));case "DEPARTMENT_TOGGLE"->departments.getObject().applyToggle(store,target,version,json.readValue(payload,StoreDepartmentAccessController.Toggle.class));default->throw access.denied();};}
 @Transactional public Object submit(String store,String operation,String target,String version,Object body,String key){
  String mod=module(operation);long uid=access.user();long company=access.company(store);lock(company);String required=access.required(uid,store,mod);String payload=json.writeValueAsString(body);
  UUID token;try{token=UUID.fromString(key);}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Idempotency-Key must be a UUID");}
  var previous=access.db.queryForList("SELECT * FROM approval_requests WHERE requested_by=? AND idempotency_key=?",uid,token);
  if(!previous.isEmpty()){var p=previous.getFirst();if(!store.equals(p.get("dgt_id"))||!operation.equals(p.get("operation_code"))||!Objects.equals(target,p.get("target_id"))||!json.readTree(payload).equals(json.readTree(p.get("proposed_values").toString())))throw new ResponseStatusException(HttpStatus.CONFLICT,"Idempotency key reused for different changes");return Map.of("pending",true,"requestId",p.get("request_id"),"status",p.get("status"));}
  if(required==null){Object result=apply(store,operation,target,version,payload);access.audit(store,"BUSINESS_CHANGE_APPLIED",operation,"{}");return result;}
  // Validate against current data with the same operation handler; rollback all trial writes.
  var tx=TransactionAspectSupport.currentTransactionStatus();Object point=tx.createSavepoint();apply(store,operation,target,version,payload);tx.rollbackToSavepoint(point);tx.releaseSavepoint(point);
  var grant=access.grant(uid,store,mod,true);String versions=json.writeValueAsString(Map.of("version",version==null?"":version));
  Long id=access.db.queryForObject("INSERT INTO approval_requests(company_id,dgt_id,module_id,requested_by,requester_role_id,required_approver,operation_code,target_id,expected_versions,proposed_values,idempotency_key) VALUES (?,?,?,?,?,?,?,?,CAST(? AS jsonb),CAST(? AS jsonb),?) RETURNING request_id",Long.class,company,store,access.module(mod),uid,grant.roleId(),required,operation,target,versions,payload,token);
  access.audit(store,"APPROVAL_SUBMITTED",id.toString(),"{}");return Map.of("pending",true,"requestId",id,"status","PENDING");
 }
 private boolean reviewer(Map<String,Object> r){String store=(String)r.get("dgt_id");long uid=access.user();if(uid==((Number)r.get("requested_by")).longValue())return false;if(access.admin(uid,access.company(store)))return true;
  if("ADMIN".equals(r.get("required_approver")))return false;
  try{return access.grant(uid,store,module((String)r.get("operation_code")),false).role().equals("MANAGER");}catch(ResponseStatusException e){return false;}
 }
 public List<Map<String,Object>> list(String store){access.assigned(store);var result=new ArrayList<Map<String,Object>>();for(var r:access.db.queryForList("SELECT a.*,u.email AS requester_email FROM approval_requests a JOIN users u ON u.user_id=a.requested_by WHERE a.dgt_id=? AND a.company_id=? ORDER BY a.created_at DESC LIMIT 200",store,access.company(store))){boolean review=reviewer(r);if(review||access.user()==((Number)r.get("requested_by")).longValue()){var row=new LinkedHashMap<>(com.dgt.backend.common.entity.Rows.normalize(r));row.put("can_review",review);
 if("DEPARTMENT_TOGGLE".equals(r.get("operation_code"))){String target=(String)r.get("target_id");String name=null;
  if(target!=null&&target.startsWith("default-")){var names=access.db.queryForList("SELECT department_name FROM departments WHERE department_id=?",String.class,Long.parseLong(target.substring(8)));if(!names.isEmpty())name=names.getFirst();}
  else if(target!=null&&target.startsWith("store-")){var names=access.db.queryForList("SELECT store_department_name FROM store_departments WHERE store_department_id=? AND dgt_id=?",String.class,Long.parseLong(target.substring(6)),store);if(!names.isEmpty())name=names.getFirst();}
  row.put("target_name",name);
 }
result.add(row);}}return result;}
 @Transactional public Object decide(String store,long id,String decision,String note){long company=access.company(store);lock(company);var rows=access.db.queryForList("SELECT * FROM approval_requests WHERE request_id=? AND dgt_id=? AND company_id=? FOR UPDATE",id,store,company);if(rows.size()!=1)throw access.denied();var r=rows.getFirst();if(!"PENDING".equals(r.get("status")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Request already decided");
  if("CANCELLED".equals(decision)){if(access.user()!=((Number)r.get("requested_by")).longValue())throw access.denied();}
  else if(decision==null||!Set.of("APPROVED","REJECTED").contains(decision)||!reviewer(r))throw access.denied();
  if("APPROVED".equals(decision)){
   long requester=((Number)r.get("requested_by")).longValue();String mod=module((String)r.get("operation_code"));var g=access.grant(requester,store,mod,true);
   if(g.roleId()!=((Number)r.get("requester_role_id")).longValue())throw new ResponseStatusException(HttpStatus.CONFLICT,"Requester role changed; resubmit");
   String current=access.required(requester,store,mod);if("ADMIN".equals(current)&&!access.admin(access.user(),company))throw access.denied();
   String version=json.readTree(r.get("expected_versions").toString()).path("version").asText();
   apply(store,(String)r.get("operation_code"),(String)r.get("target_id"),version,r.get("proposed_values").toString());
  }
  access.db.update("UPDATE approval_requests SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_note=? WHERE request_id=?",decision,"CANCELLED".equals(decision)?null:access.user(),note,id);
  access.audit(store,"APPROVAL_"+decision,Long.toString(id),"{}");return Map.of("status",decision,"requestId",id);
 }
 private void lock(long company){access.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",company);}
}
