package com.dgt.backend.access;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
@RestController
@RequestMapping("/api/v1/access")
public class AccessController {
 private final ScopedAccess access;
 private final PagePermissions pages;
 private final PasswordEncoder encoder;
 public AccessController(ScopedAccess access,PagePermissions pages,PasswordEncoder encoder){this.access=access;this.pages=pages;this.encoder=encoder;}
 @GetMapping("/me") public Map<String,Object> me(){return Map.of("userId",access.user());}
 @GetMapping("/stores") public Object stores(){return access.stores().stream().map(com.dgt.backend.common.entity.Rows::normalize).toList();}
 @GetMapping("/stores/{store}/context") public Object context(@PathVariable String store){access.assigned(store);var rights=new LinkedHashMap<String,Object>();for(String module:List.of("STORE_SETTINGS","DEPARTMENTS","PRICE_BOOK")){boolean view=false,edit=false;String approval=null;try{access.grant(access.user(),store,module,false);view=true;}catch(ResponseStatusException ignored){}try{approval=access.required(access.user(),store,module);edit=true;}catch(ResponseStatusException ignored){}var r=new LinkedHashMap<String,Object>();r.put("view",view);r.put("edit",edit);r.put("approval",approval);rights.put(module,r);}return Map.of("admin",access.admin(access.user(),access.company(store)),"modules",rights,"pages",pages.context(store),"roles",access.db.queryForList("SELECT DISTINCT upper(t.role_type_name) FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active",String.class,access.user(),store));}
 @GetMapping("/stores/{store}/permissions") public Object permissions(@PathVariable String store){access.requireAdmin(store);return Map.of(
 "users",access.db.queryForList("SELECT u.user_id,u.email FROM users u JOIN stores s ON s.dgt_id=u.dgt_id WHERE s.company_id=? AND u.account_status='ACTIVE' AND NOT u.two_factor_authentication ORDER BY u.email",access.company(store)),
 "roles",access.db.queryForList("SELECT role_type_id,role_type_name FROM role_types WHERE is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT') ORDER BY role_type_name"),
 "assignments",access.db.queryForList("SELECT ur.user_role_id,ur.user_id,ur.role_type_id,u.email,rt.role_type_name,ur.is_active,ur.xmin::text AS version FROM user_roles ur JOIN users u USING(user_id) JOIN role_types rt USING(role_type_id) WHERE ur.dgt_id=? ORDER BY u.email,rt.role_type_name",store),
 "permissions",access.db.queryForList("SELECT p.*,p.xmin::text AS version,m.module_name FROM permissions p JOIN user_roles ur USING(user_role_id) JOIN modules m USING(module_id) WHERE ur.dgt_id=? AND m.module_name IN ('STORE_SETTINGS','DEPARTMENTS','PRICE_BOOK')",store).stream().map(com.dgt.backend.common.entity.Rows::normalize).toList(),
 "modules",access.db.queryForList("SELECT module_id,module_name FROM modules WHERE is_active AND module_name IN ('STORE_SETTINGS','DEPARTMENTS','PRICE_BOOK') ORDER BY module_id"),
 "policies",access.db.queryForList("SELECT module_id,manager_requires_admin,xmin::text AS version FROM module_approval_policies WHERE company_id=?",access.company(store)));
 }
 public record Permission(long roleId,long moduleId,boolean view,boolean edit,String version){}
 @PutMapping("/stores/{store}/permissions") public Object save(@PathVariable String store,@RequestBody Permission p){access.requireAdmin(store);throw new ResponseStatusException(HttpStatus.GONE,"Individual permissions replaced by store role permissions");}
 public record Policy(long moduleId,boolean required,String version){}
 @PutMapping("/stores/{store}/approval-policy") @Transactional public Object policy(@PathVariable String store,@RequestBody Policy p){lockCompany(store);access.requireAdmin(store);var mods=access.db.queryForList("SELECT module_name FROM modules WHERE module_id=?",String.class,p.moduleId());if(mods.size()!=1)throw access.denied();access.module(mods.getFirst());var old=access.db.queryForList("SELECT xmin::text AS version FROM module_approval_policies WHERE company_id=? AND module_id=?",access.company(store),p.moduleId());if(!Objects.equals(p.version(),old.isEmpty()?"0":old.getFirst().get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Policy changed; reload");access.db.update("INSERT INTO module_approval_policies(company_id,module_id,manager_requires_admin,updated_by) VALUES (?,?,?,?) ON CONFLICT(company_id,module_id) DO UPDATE SET manager_requires_admin=EXCLUDED.manager_requires_admin,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP",access.company(store),p.moduleId(),p.required(),access.user());access.audit(store,"APPROVAL_POLICY_UPDATED",Long.toString(p.moduleId()),"{\"required\":"+p.required()+"}");return permissions(store);}

 public record Assignment(long userId,long roleTypeId,Boolean active,String version){}
 @PutMapping("/stores/{store}/roles") @Transactional public Object assignment(@PathVariable String store,@RequestBody Assignment a){lockCompany(store);access.requireAdmin(store);if(a.active()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"active required");
  var users=access.db.queryForList("SELECT u.user_id FROM users u JOIN stores s ON s.dgt_id=u.dgt_id WHERE u.user_id=? AND s.company_id=?",a.userId(),access.company(store));
  var roles=access.db.queryForList("SELECT role_type_name FROM role_types WHERE role_type_id=? AND is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT')",String.class,a.roleTypeId());if(users.size()!=1||roles.size()!=1)throw access.denied();
  var previous=access.db.queryForList("SELECT xmin::text AS version FROM user_roles WHERE user_id=? AND role_type_id=? AND dgt_id=?",a.userId(),a.roleTypeId(),store);String version=previous.isEmpty()?"0":(String)previous.getFirst().get("version");if(!Objects.equals(version,a.version()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Role assignment changed; reload");
  Long role=access.db.queryForObject("INSERT INTO user_roles(user_id,role_type_id,dgt_id,is_active) VALUES (?,?,?,?) ON CONFLICT(user_id,role_type_id,dgt_id) DO UPDATE SET is_active=EXCLUDED.is_active,updated_at=CURRENT_TIMESTAMP RETURNING user_role_id",Long.class,a.userId(),a.roleTypeId(),store,a.active());
  // New assignments inherit the role permissions configured for this store.
  access.audit(store,"ROLE_ASSIGNMENT_UPDATED",role.toString(),"{\"active\":"+a.active()+"}");return permissions(store);
 }
 public record NewGrant(long moduleId,boolean view,boolean edit){}
 public record NewUser(String firstName,String lastName,String employeeId,String email,String password,long roleTypeId,List<String> stores,List<NewGrant> modules){}
 @PostMapping("/stores/{store}/users") @ResponseStatus(HttpStatus.CREATED) @Transactional
 public Object createUser(@PathVariable String store,@RequestBody NewUser input){
  lockCompany(store);access.requireAdmin(store);
  String first=required(input.firstName(),100,"First name"),last=required(input.lastName(),100,"Last name"),employee=required(input.employeeId(),50,"Employee ID");
  String email=required(input.email(),255,"Email").toLowerCase(Locale.ROOT);
  if(!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Valid email required");
  if(input.password()==null||input.password().length()<12||input.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Password must be at least 12 characters and at most 72 bytes");
  var roles=access.db.queryForList("SELECT role_type_name FROM role_types WHERE role_type_id=? AND is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT')",String.class,input.roleTypeId());
  if(roles.size()!=1)throw access.denied();
  if(input.stores()==null||input.stores().isEmpty()||input.stores().size()>100||!input.stores().contains(store)||new HashSet<>(input.stores()).size()!=input.stores().size())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select the current store and unique store assignments");
  if(!roles.getFirst().equals("MANAGER")&&input.stores().size()!=1)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Only managers can be assigned multiple stores here");
  for(String target:input.stores()){if(access.company(target)!=access.company(store))throw access.denied();access.requireAdmin(target);}
  if(input.modules()!=null&&!input.modules().isEmpty())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Users inherit store role permissions; do not provide individual modules");
  if(Boolean.TRUE.equals(access.db.queryForObject("SELECT EXISTS(SELECT 1 FROM users WHERE lower(email)=? OR (dgt_id=? AND employee_id=?))",Boolean.class,email,store,employee)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Email or employee ID already exists");
  try {
   String hash=encoder.encode(input.password());
   Long uid=access.db.queryForObject("INSERT INTO users(dgt_id,employee_id,first_name,last_name,email,password_hash) VALUES (?,?,?,?,?,?) RETURNING user_id",Long.class,store,employee,first,last,email,hash);
   for(String target:input.stores()){
    Long role=access.db.queryForObject("INSERT INTO user_roles(user_id,role_type_id,dgt_id,is_active) VALUES (?,?,?,true) RETURNING user_role_id",Long.class,uid,input.roleTypeId(),target);

    access.audit(target,"USER_CREATED",uid.toString(),"{\"roleTypeId\":"+input.roleTypeId()+"}");
   }
   return Map.of("userId",uid,"email",email);
  } catch(org.springframework.dao.DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Email or employee ID already exists");}
 }
 private String required(String value,int max,String label){if(value==null||value.trim().isEmpty()||value.trim().length()>max)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,label+" is required (maximum "+max+" characters)");return value.trim();}
 private void lockCompany(String store){access.db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE",access.company(store));}
}
