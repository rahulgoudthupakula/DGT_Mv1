package com.dgt.backend.access.service;
import com.dgt.backend.access.repository.AccessRepository;
import com.dgt.backend.access.security.PagePermissions;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.dto.ApprovalPolicyRequest;
import com.dgt.backend.access.dto.CreateAccessUserRequest;
import com.dgt.backend.access.dto.LegacyPermissionRequest;
import com.dgt.backend.access.dto.RoleAssignmentRequest;
import java.util.*;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

/**
 * Access API for the signed-in user: store selection, permission context, role assignments,
 * approval policies and account creation. Store administration routes require company-admin
 * access; context describes permissions but does not replace endpoint authorization.
 */
@org.springframework.stereotype.Service

public class AccessService {
 private final AccessRepository repository;
 private final ScopedAccess access;
 private final PagePermissions pages;
 private final PasswordEncoder encoder;
 public AccessService(ScopedAccess access,PagePermissions pages,PasswordEncoder encoder, AccessRepository repository){this.repository=repository;this.access=access;this.pages=pages;this.encoder=encoder;}
 // Return the database user ID associated with the authenticated identity.
  public Map<String,Object> me(){return Map.of("userId",access.user());}
 // Populate the store selector with locations assigned to this user or administered by their
 // company role.
  public Object stores(){return access.stores().stream().map(com.dgt.backend.common.entity.Rows::normalize).toList();}
 // Build navigation/action context: module view/edit flags, approval requirements, page rights and
 // store roles.
  public Object context(String store){access.assigned(store);var rights=new LinkedHashMap<String,Object>();for(String module:List.of("STORE_SETTINGS","DEPARTMENTS","PRICE_BOOK")){boolean view=false,edit=false;String approval=null;try{access.grant(access.user(),store,module,false);view=true;}catch(ResponseStatusException ignored){}try{approval=access.required(access.user(),store,module);edit=true;}catch(ResponseStatusException ignored){}var r=new LinkedHashMap<String,Object>();r.put("view",view);r.put("edit",edit);r.put("approval",approval);rights.put(module,r);}return Map.of("admin",access.admin(access.user(),access.company(store)),"modules",rights,"pages",pages.context(store),"roles",repository.findUserRoles(access.user(), store));}
 // Admin snapshot of accounts, assignments and approval policies; individual permission rows are
 // legacy data.
  public Object permissions(String store){access.requireAdmin(store);return Map.of(
 "users",repository.findCompanyUsers(access.company(store)),
 "roles",repository.findRoles(),
 "assignments",repository.findAssignments(store),
 "permissions",repository.findLegacyPermissions(store).stream().map(com.dgt.backend.common.entity.Rows::normalize).toList(),
 "modules",repository.findModules(),
 "policies",repository.findPolicies(access.company(store)));
 }

 // Retired write contract: return 410 instead of silently accepting obsolete individual
 // permissions.
  public Object save(String store,LegacyPermissionRequest p){access.requireAdmin(store);throw new ResponseStatusException(HttpStatus.GONE,"Individual permissions replaced by store role permissions");}

 // Company-wide policy update, serialized by a company lock and protected by the previous row
 // version.
  @Transactional public Object policy(String store,ApprovalPolicyRequest p){lockCompany(store);access.requireAdmin(store);var mods=repository.findModuleNames(p.moduleId());if(mods.size()!=1)throw access.denied();access.module(mods.getFirst());var old=repository.findPolicyVersion(access.company(store), p.moduleId());if(!Objects.equals(p.version(),old.isEmpty()?"0":old.getFirst().get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Policy changed; reload");repository.savePolicy(access.company(store), p.moduleId(), p.required(), access.user());access.audit(store,"APPROVAL_POLICY_UPDATED",Long.toString(p.moduleId()),"{\"required\":"+p.required()+"}");return permissions(store);}

 // Assign or deactivate a supported role only within the selected company; reject stale assignment
 // versions.
  @Transactional public Object assignment(String store,RoleAssignmentRequest a){lockCompany(store);access.requireAdmin(store);if(a.active()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"active required");
  var users=repository.findCompanyUser(a.userId(), access.company(store));
  var roles=repository.findRoleNames(a.roleTypeId());if(users.size()!=1||roles.size()!=1)throw access.denied();
  var previous=repository.findAssignmentVersion(a.userId(), a.roleTypeId(), store);String version=previous.isEmpty()?"0":(String)previous.getFirst().get("version");if(!Objects.equals(version,a.version()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Role assignment changed; reload");
  Long role=repository.saveAssignment(a.userId(), a.roleTypeId(), store, a.active());
  // New assignments inherit the role permissions configured for this store.
  access.audit(store,"ROLE_ASSIGNMENT_UPDATED",role.toString(),"{\"active\":"+a.active()+"}");return permissions(store);
 }


   @Transactional
 public Object createUser(String store,CreateAccessUserRequest input){
  lockCompany(store);access.requireAdmin(store);
  String first=required(input.firstName(),100,"First name"),last=required(input.lastName(),100,"Last name"),employee=required(input.employeeId(),50,"Employee ID");
  String email=required(input.email(),255,"Email").toLowerCase(Locale.ROOT);
  if(!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Valid email required");
  if(input.password()==null||input.password().length()<12||input.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Password must be at least 12 characters and at most 72 bytes");
  var roles=repository.findRoleNames(input.roleTypeId());
  if(roles.size()!=1)throw access.denied();
  if(input.stores()==null||input.stores().isEmpty()||input.stores().size()>100||!input.stores().contains(store)||new HashSet<>(input.stores()).size()!=input.stores().size())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select the current store and unique store assignments");
  if(!roles.getFirst().equals("MANAGER")&&input.stores().size()!=1)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Only managers can be assigned multiple stores here");
  for(String target:input.stores()){if(access.company(target)!=access.company(store))throw access.denied();access.requireAdmin(target);}
  if(input.modules()!=null&&!input.modules().isEmpty())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Users inherit store role permissions; do not provide individual modules");
  if(Boolean.TRUE.equals(repository.accountExists(email, store, employee)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Email or employee ID already exists");
  try {
   String hash=encoder.encode(input.password());
   Long uid=repository.insertUser(store, employee, first, last, email, hash);
   for(String target:input.stores()){
    Long role=repository.insertAssignment(uid, input.roleTypeId(), target);

    access.audit(target,"USER_CREATED",uid.toString(),"{\"roleTypeId\":"+input.roleTypeId()+"}");
   }
   return Map.of("userId",uid,"email",email);
  } catch(org.springframework.dao.DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Email or employee ID already exists");}
 }
 private String required(String value,int max,String label){if(value==null||value.trim().isEmpty()||value.trim().length()>max)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,label+" is required (maximum "+max+" characters)");return value.trim();}
 // Serialize related administration changes for this company within the caller transaction.
 private void lockCompany(String store){repository.lockCompany(access.company(store));}
}
