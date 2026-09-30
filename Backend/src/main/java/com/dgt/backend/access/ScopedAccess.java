package com.dgt.backend.access;
import java.util.*;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.server.ResponseStatusException;
@Component("scopedAccess")
public class ScopedAccess {
 public final JdbcTemplate db;
 private final ObjectProvider<ScopedAccessCache> cacheProvider;
 public ScopedAccess(JdbcTemplate db,ObjectProvider<ScopedAccessCache> cacheProvider){this.db=db;this.cacheProvider=cacheProvider;}
 private ScopedAccessCache cache(){if(RequestContextHolder.getRequestAttributes()==null)return null;try{return cacheProvider.getIfAvailable();}catch(Exception ignored){return null;}}
 public long user(){var c=cache();if(c!=null){if(c.userId==null)c.userId=resolveUser();return c.userId;}return resolveUser();}
 private long resolveUser(){var a=SecurityContextHolder.getContext().getAuthentication();if(a==null)throw denied();return user(a);}
 public long user(Authentication a){var ids=db.queryForList("SELECT user_id FROM users WHERE email=? AND account_status='ACTIVE' AND two_factor_authentication=false",Long.class,a.getName());if(ids.size()!=1)throw denied();return ids.getFirst();}
 public long company(String store){var c=cache();if(c!=null)return c.companyByStore.computeIfAbsent(store,this::resolveCompany);return resolveCompany(store);}
 private long resolveCompany(String store){var ids=db.queryForList("SELECT s.company_id FROM stores s JOIN companies c ON c.company_id=s.company_id WHERE s.dgt_id=? AND c.is_active",Long.class,store);if(ids.size()!=1)throw denied();return ids.getFirst();}
 public Map<String,Boolean> cachedPageRights(String store){var c=cache();return c!=null&&c.pageRightsByStore!=null?c.pageRightsByStore.get(store):null;}
 public void putPageRights(String store,Map<String,Boolean> rights){var c=cache();if(c!=null){if(c.pageRightsByStore==null)c.pageRightsByStore=new HashMap<>();c.pageRightsByStore.put(store,rights);}}
 public boolean admin(long uid,long company){return Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM company_admins ca JOIN companies c USING(company_id) JOIN users u ON u.user_id=ca.user_id WHERE ca.user_id=? AND ca.company_id=? AND ca.is_active AND c.is_active AND u.account_status='ACTIVE' AND NOT u.two_factor_authentication)",Boolean.class,uid,company));}
 public void requireAdmin(String store){if(!admin(user(),company(store)))throw denied();}
 public record Grant(long roleId,String role){}
 public Grant grant(long uid,String store,String module,boolean edit){
  long company=company(store);if(admin(uid,company))return new Grant(0,"ADMIN");
  if("PRICE_BOOK".equals(module)){
   var managers=db.queryForList("SELECT ur.user_role_id FROM user_roles ur JOIN role_types rt USING(role_type_id) JOIN users u USING(user_id) JOIN store_role_permissions p ON p.dgt_id=ur.dgt_id AND p.role_type_id=ur.role_type_id WHERE ur.user_id=? AND ur.dgt_id=? AND ur.is_active AND rt.is_active AND upper(rt.role_type_name)='MANAGER' AND u.account_status='ACTIVE' AND NOT u.two_factor_authentication AND p.permission_code='PRICE_BOOK_ACCESS' AND p.allowed AND EXISTS(SELECT 1 FROM modules WHERE module_name='PRICE_BOOK' AND is_active)",Long.class,uid,store);
   if(managers.isEmpty())throw denied();return new Grant(managers.getFirst(),"MANAGER");
  }

  var rows=db.queryForList("SELECT ur.user_role_id,upper(rt.role_type_name) AS role FROM user_roles ur JOIN role_types rt USING(role_type_id) JOIN store_role_permissions p ON p.dgt_id=ur.dgt_id AND p.role_type_id=ur.role_type_id JOIN modules m ON p.permission_code=m.module_name || '_VIEW' JOIN users u USING(user_id) WHERE ur.user_id=? AND ur.dgt_id=? AND ur.is_active AND rt.is_active AND p.allowed AND m.is_active AND u.account_status='ACTIVE' AND NOT u.two_factor_authentication AND m.module_name=? AND (?=false OR EXISTS(SELECT 1 FROM store_role_permissions ep WHERE ep.dgt_id=ur.dgt_id AND ep.role_type_id=ur.role_type_id AND ep.permission_code=m.module_name || '_EDIT' AND ep.allowed)) AND upper(rt.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT') ORDER BY CASE upper(rt.role_type_name) WHEN 'MANAGER' THEN 0 WHEN 'CASHIER' THEN 1 ELSE 2 END,ur.user_role_id",uid,store,module,edit);
  if(rows.isEmpty())throw denied();var r=rows.getFirst();return new Grant(((Number)r.get("user_role_id")).longValue(),(String)r.get("role"));
 }
 public boolean can(Authentication a,String store,String module,boolean edit){try{grant(user(a),store,module,edit);return true;}catch(ResponseStatusException e){return false;}}
 public long module(String code){if(!Set.of("STORE_SETTINGS","DEPARTMENTS","PRICE_BOOK").contains(code))throw denied();return db.queryForObject("SELECT module_id FROM modules WHERE module_name=? AND is_active",Long.class,code);}
 public String required(long uid,String store,String module){var g=grant(uid,store,module,true);if(g.role().equals("ADMIN"))return null;if(!g.role().equals("MANAGER"))return "MANAGER_OR_ADMIN";
  boolean yes=Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM module_approval_policies WHERE company_id=? AND module_id=? AND manager_requires_admin)",Boolean.class,company(store),module(module)));return yes?"ADMIN":null;
 }
 public List<Map<String,Object>> stores(){long uid=user();return db.queryForList("SELECT s.*,s.xmin::text AS _version FROM stores s JOIN companies c ON c.company_id=s.company_id WHERE c.is_active AND (EXISTS(SELECT 1 FROM company_admins ca WHERE ca.company_id=c.company_id AND ca.user_id=? AND ca.is_active) OR EXISTS(SELECT 1 FROM user_roles ur JOIN role_types rt USING(role_type_id) WHERE ur.dgt_id=s.dgt_id AND ur.user_id=? AND ur.is_active AND rt.is_active AND upper(rt.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT'))) ORDER BY s.dgt_id",uid,uid);}
 public void assigned(String store){if(stores().stream().noneMatch(s->store.equals(s.get("dgt_id"))))throw denied();}
 public void audit(String store,String event,String target,String changes){db.update("INSERT INTO access_audit_events(company_id,dgt_id,actor_user_id,event_type,target_type,target_id,changes) VALUES (?,?,?,?,?,?,CAST(? AS jsonb))",company(store),store,user(),event,"ACCESS",target,changes);}
 public ResponseStatusException denied(){return new ResponseStatusException(HttpStatus.FORBIDDEN,"Access denied for this store or module");}
}
