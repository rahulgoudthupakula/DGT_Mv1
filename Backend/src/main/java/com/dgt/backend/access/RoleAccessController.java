package com.dgt.backend.access;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
@RestController
@RequestMapping("/api/v1/access/stores/{store}/role-permissions")
public class RoleAccessController {
 private final ScopedAccess access;
 public RoleAccessController(ScopedAccess access){this.access=access;}
 public record Action(String code,String label,String group,boolean implemented){}
 public static final List<Action> ACTIONS=List.of(
  new Action("GAS_VIEW_DELIVERIES","View gas deliveries","Gas Permissions",true),
  new Action("GAS_RECORD_DELIVERY","Create and edit gas delivery drafts","Gas Permissions",true),
  new Action("GAS_RECEIVE_DELIVERY","Confirm gas deliveries received","Gas Permissions",true),
  new Action("GAS_VIEW_ADJUSTMENTS","View gas adjustments and tank reports","Gas Permissions",true),
  new Action("GAS_RECORD_ADJUSTMENT","Create and edit gas adjustments","Gas Permissions",true),
  new Action("GAS_APPROVE_ADJUSTMENT","Approve gas adjustments","Gas Permissions",true),
  new Action("GAS_SETTINGS","Manage gas settings and selling prices","Gas Permissions",true),
  new Action("PRICE_BOOK_ACCESS","Price Book Access","Price Book Permissions",true),
  new Action("STORE_SETTINGS_VIEW","View store account","Store Permissions",true),new Action("STORE_SETTINGS_EDIT","Edit store account","Store Permissions",true),
  new Action("DEPARTMENTS_VIEW","View departments","Store Permissions",true),new Action("DEPARTMENTS_EDIT","Edit departments","Store Permissions",true),
  new Action("GROCERY_VIEW_INVENTORY","View inventory","Grocery Permissions",true),new Action("GROCERY_ADJUST_STOCK","Adjust stock","Grocery Permissions",true),
  new Action("GROCERY_REDUCE_STOCK","Reduce stock","Grocery Permissions",true),new Action("GROCERY_CREATE_PO","Create PO","Grocery Permissions",true),
  new Action("GROCERY_APPROVE_PO","Approve PO","Grocery Permissions",true),new Action("GROCERY_RECEIVE_INVENTORY","Receive inventory","Grocery Permissions",false),
  new Action("GROCERY_APPROVE_INVOICE","Approve invoice","Grocery Permissions",false),new Action("GROCERY_SETTINGS","Change grocery settings","Grocery Permissions",true),
  new Action("LOTTERY_RECEIVE_DELIVERY","Receive delivery","Lottery Permissions",false),new Action("LOTTERY_CONFIRM_PACKS","Confirm packs","Lottery Permissions",false),
  new Action("LOTTERY_ACTIVATE_PACKS","Activate packs","Lottery Permissions",false),new Action("LOTTERY_CLOSE_SHIFT","Close shift","Lottery Permissions",false),
  new Action("LOTTERY_RETURN_PACKS","Return packs","Lottery Permissions",false),new Action("LOTTERY_SETTLE_PACKS","Settle packs","Lottery Permissions",false),
  new Action("LOTTERY_VIEW_REPORTS","View lottery reports","Lottery Permissions",false),new Action("LOTTERY_SETTINGS","Change lottery settings","Lottery Permissions",false));
 @GetMapping public Object get(@PathVariable String store){access.requireAdmin(store);return Map.of("actions",ACTIONS,"roles",access.db.queryForList("SELECT role_type_id,role_type_name FROM role_types WHERE is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT') ORDER BY CASE role_type_name WHEN 'MANAGER' THEN 0 WHEN 'CASHIER' THEN 1 ELSE 2 END"),"permissions",access.db.queryForList("SELECT *,xmin::text AS version FROM store_role_permissions WHERE dgt_id=?",store).stream().map(com.dgt.backend.common.entity.Rows::normalize).toList());}
 public record Change(long roleTypeId,String code,boolean allowed,String version){}
 public record Batch(List<Change> changes){}
 @PutMapping("/batch") @Transactional public Object saveBatch(@PathVariable String store,@RequestBody Batch batch){
  access.requireAdmin(store);access.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",access.company(store));access.requireAdmin(store);
  if(batch.changes()==null||batch.changes().size()>60)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid preferences");
  Set<String> seen=new HashSet<>();
  for(Change c:batch.changes()){
   if(c==null||!seen.add(c.roleTypeId()+":"+c.code()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Duplicate preference");
   var versions=access.db.queryForList("SELECT xmin::text FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code=?",String.class,store,c.roleTypeId(),c.code());
   if(!Objects.equals(c.version(),versions.isEmpty()?"0":versions.getFirst()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Preferences changed. Cancel and edit again to reload the latest values");
  }
  // Validate snapshots before any write, then apply dependency order in one transaction.
  var ordered=new ArrayList<>(batch.changes());
  ordered.sort(Comparator.comparingInt(c->c.code()!=null&&c.code().endsWith("_EDIT")?(c.allowed()?2:0):1));
  for(Change c:ordered){
   var versions=access.db.queryForList("SELECT xmin::text FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code=?",String.class,store,c.roleTypeId(),c.code());
   save(store,new Change(c.roleTypeId(),c.code(),c.allowed(),versions.isEmpty()?"0":versions.getFirst()));
  }
  return get(store);
 }
 @PutMapping @Transactional public Object save(@PathVariable String store,@RequestBody Change c){
  access.requireAdmin(store);access.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",access.company(store));access.requireAdmin(store);
  if(ACTIONS.stream().noneMatch(a->a.code().equals(c.code())))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown permission");
  if(access.db.queryForList("SELECT role_type_id FROM role_types WHERE role_type_id=? AND is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT')",c.roleTypeId()).size()!=1)throw access.denied();
  if("PRICE_BOOK_ACCESS".equals(c.code()) && access.db.queryForList("SELECT role_type_id FROM role_types WHERE role_type_id=? AND upper(role_type_name)='MANAGER'",c.roleTypeId()).size()!=1)throw access.denied();
  if(c.allowed()&&Set.of("GROCERY_APPROVE_PO","GROCERY_SETTINGS","GAS_SETTINGS","GAS_APPROVE_ADJUSTMENT").contains(c.code())&&access.db.queryForList("SELECT role_type_id FROM role_types WHERE role_type_id=? AND upper(role_type_name)='MANAGER'",c.roleTypeId()).isEmpty())throw access.denied();
  var old=access.db.queryForList("SELECT xmin::text AS version FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code=?",store,c.roleTypeId(),c.code());
  if(!Objects.equals(c.version(),old.isEmpty()?"0":old.getFirst().get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Role permissions changed; reload and try again");
  if(c.allowed()&&Set.of("STORE_SETTINGS_EDIT","DEPARTMENTS_EDIT").contains(c.code())){
   String view=c.code().replace("_EDIT","_VIEW");
   if(!Boolean.TRUE.equals(access.db.queryForObject("SELECT EXISTS(SELECT 1 FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code=? AND allowed)",Boolean.class,store,c.roleTypeId(),view)))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Enable viewing before editing");
  }
  access.db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed,updated_by) VALUES (?,?,?,?,?) ON CONFLICT(dgt_id,role_type_id,permission_code) DO UPDATE SET allowed=EXCLUDED.allowed,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP",store,c.roleTypeId(),c.code(),c.allowed(),access.user());
  // Removing view also removes edit; audit records the requested action and resulting edit revocation.
  boolean revoke=!c.allowed()&&Set.of("STORE_SETTINGS_VIEW","DEPARTMENTS_VIEW").contains(c.code());
  if(revoke)access.db.update("UPDATE store_role_permissions SET allowed=false,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND role_type_id=? AND permission_code=?",access.user(),store,c.roleTypeId(),c.code().replace("_VIEW","_EDIT"));
  access.audit(store,"STORE_ROLE_PERMISSION_UPDATED",Long.toString(c.roleTypeId()),"{\"code\":\""+c.code()+"\",\"allowed\":"+c.allowed()+",\"editRevoked\":"+revoke+"}");return get(store);
 }
}
