package com.dgt.backend.access.service;
import com.dgt.backend.access.repository.RoleAccessRepository;
import com.dgt.backend.access.security.PagePermissions;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.dto.RolePermissionBatch;
import com.dgt.backend.access.dto.RolePermissionChange;
import java.util.*;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Company-admin editor for store role permission defaults. Both individual and batch changes use
 * row versions, validate recognized codes and roles, and audit resulting changes.
 */
@org.springframework.stereotype.Service

public class RoleAccessService {
 private final RoleAccessRepository repository;
 private final ScopedAccess access;
 public RoleAccessService(ScopedAccess access, RoleAccessRepository repository){this.repository=repository;this.access=access;}
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
  new Action("LOTTERY_RECEIVE_DELIVERY","Receive delivery","Lottery Permissions",true),new Action("LOTTERY_CONFIRM_PACKS","Confirm packs","Lottery Permissions",true),
  new Action("LOTTERY_ACTIVATE_PACKS","Record completed pack activations","Lottery Permissions",true),new Action("LOTTERY_CLOSE_SHIFT","Close shift","Lottery Permissions",true),
  new Action("LOTTERY_RETURN_PACKS","Return packs","Lottery Permissions",true),new Action("LOTTERY_SETTLE_PACKS","Settle packs","Lottery Permissions",true),
  new Action("LOTTERY_VIEW_REPORTS","View pack history","Lottery Permissions",true),new Action("LOTTERY_SETTINGS","Manage lottery games and counter setting","Lottery Permissions",true));
 // Build the editor catalogue from module/page definitions while omitting legacy action groups
 // from this view.
 private static List<Action> visibleActions(){
  var list=new ArrayList<Action>();
  PagePermissions.SECTIONS.forEach(s->list.add(new Action(s.code(),s.label(),"Store Permissions",true)));
  ACTIONS.stream().filter(a->!Set.of("STORE_SETTINGS_VIEW","STORE_SETTINGS_EDIT").contains(a.code())).filter(a->!Set.of("Grocery Permissions","Gas Permissions","Lottery Permissions").contains(a.group())).forEach(list::add);
  PagePermissions.PAGES.forEach(p->list.add(new Action(p.code(),p.label(),p.group(),p.implemented())));return list;
 }
 // Only company admins can read the role editor snapshot and its optimistic-lock versions.
  public Object get(String store){access.requireAdmin(store);return Map.of("actions",visibleActions(),"sections",PagePermissions.SECTIONS,"pages",PagePermissions.PAGES,"children",PagePermissions.CHILDREN,"roles",repository.findRoles(),"permissions",repository.findPermissions(store).stream().map(com.dgt.backend.common.entity.Rows::normalize).toList());}


 // Check every incoming version before writing; order edit changes around view changes to preserve
 // dependencies.
  @Transactional public Object saveBatch(String store,RolePermissionBatch batch){
  access.requireAdmin(store);repository.lockCompany(access.company(store));access.requireAdmin(store);
  if(batch.changes()==null||batch.changes().size()>150)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid preferences");
  Set<String> seen=new HashSet<>();
  for(RolePermissionChange c:batch.changes()){
   if(c==null||!seen.add(c.roleTypeId()+":"+c.code()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Duplicate preference");
   var versions=repository.findVersion(store, c.roleTypeId(), c.code());
   if(!Objects.equals(c.version(),versions.isEmpty()?"0":versions.getFirst()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Preferences changed. Cancel and edit again to reload the latest values");
  }
  // Validate snapshots before any write, then apply dependency order in one transaction.
  var ordered=new ArrayList<>(batch.changes());
  ordered.sort(Comparator.comparingInt(c->c.code()!=null&&c.code().endsWith("_EDIT")?(c.allowed()?2:0):1));
  for(RolePermissionChange c:ordered){
   var versions=repository.findVersion(store, c.roleTypeId(), c.code());
   save(store,new RolePermissionChange(c.roleTypeId(),c.code(),c.allowed(),versions.isEmpty()?"0":versions.getFirst()));
  }
  return get(store);
 }
 // Validate a single role preference, enforce role restrictions, then save and audit it
 // atomically.
  @Transactional public Object save(String store,RolePermissionChange c){
  access.requireAdmin(store);repository.lockCompany(access.company(store));access.requireAdmin(store);
  if(PagePermissions.SECTIONS.stream().noneMatch(p->p.code().equals(c.code()))&&ACTIONS.stream().noneMatch(a->a.code().equals(c.code()))&&PagePermissions.PAGES.stream().noneMatch(p->p.code().equals(c.code()))&&PagePermissions.CHILDREN.stream().noneMatch(p->p.code().equals(c.code())))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown permission");
  if(repository.findSupportedRole(c.roleTypeId()).size()!=1)throw access.denied();
  if("PRICE_BOOK_ACCESS".equals(c.code()) && repository.findManagerRole(c.roleTypeId()).size()!=1)throw access.denied();
  if(c.allowed()&&Set.of("GROCERY_APPROVE_PO","GROCERY_SETTINGS","GAS_SETTINGS","GAS_APPROVE_ADJUSTMENT").contains(c.code())&&repository.findManagerRole(c.roleTypeId()).isEmpty())throw access.denied();
  var old=repository.findVersionRow(store, c.roleTypeId(), c.code());
  if(!Objects.equals(c.version(),old.isEmpty()?"0":old.getFirst().get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Role permissions changed; reload and try again");
  if(c.allowed()&&Set.of("STORE_SETTINGS_EDIT","DEPARTMENTS_EDIT").contains(c.code())){
   String view=c.code().replace("_EDIT","_VIEW");
   if(!Boolean.TRUE.equals(repository.isAllowed(store, c.roleTypeId(), view)))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Enable viewing before editing");
  }
  repository.savePermission(store, c.roleTypeId(), c.code(), c.allowed(), access.user());
  // Removing view also removes edit; audit records the requested action and resulting edit revocation.
  boolean revoke=!c.allowed()&&Set.of("STORE_SETTINGS_VIEW","DEPARTMENTS_VIEW").contains(c.code());
  if(revoke)repository.revokeEdit(access.user(), store, c.roleTypeId(), c.code().replace("_VIEW","_EDIT"));
  access.audit(store,"STORE_ROLE_PERMISSION_UPDATED",Long.toString(c.roleTypeId()),"{\"code\":\""+c.code()+"\",\"allowed\":"+c.allowed()+",\"editRevoked\":"+revoke+"}");return get(store);
 }
}
