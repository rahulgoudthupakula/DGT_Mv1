package com.dgt.backend.access.security;
import com.dgt.backend.access.repository.ScopedAccessRepository;

import java.util.*;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.server.ResponseStatusException;

/**
 * Shared database-backed authorization helper. Resolves active users, company/store membership,
 * module grants, approval requirements and access audit events for store-scoped endpoints.
 */
@Component("scopedAccess")
public class ScopedAccess {
 private final ScopedAccessRepository repository;
 // Compatibility for domain modules outside access that still use this shared JDBC handle.
 // Access-package queries themselves belong to ScopedAccessRepository.
 public final JdbcTemplate db;
 private final ObjectProvider<ScopedAccessCache> cacheProvider;
 public ScopedAccess(JdbcTemplate db,ObjectProvider<ScopedAccessCache> cacheProvider, ScopedAccessRepository repository){this.repository=repository;this.db=db;this.cacheProvider=cacheProvider;}
 // Outside HTTP requests, skip memoization and resolve directly from the database.
 private ScopedAccessCache cache(){if(RequestContextHolder.getRequestAttributes()==null)return null;try{return cacheProvider.getIfAvailable();}catch(Exception ignored){return null;}}
 public long user(){var c=cache();if(c!=null){if(c.userId==null)c.userId=resolveUser();return c.userId;}return resolveUser();}
 private long resolveUser(){var a=SecurityContextHolder.getContext().getAuthentication();if(a==null)throw denied();return user(a);}
 // Resolve exactly one ACTIVE account; this path excludes accounts with two-factor authentication
 // enabled.
 public long user(Authentication a){var ids=repository.findActiveUserIds(a.getName());if(ids.size()!=1)throw denied();return ids.getFirst();}
 public long company(String store){var c=cache();if(c!=null)return c.companyByStore.computeIfAbsent(store,this::resolveCompany);return resolveCompany(store);}
 private long resolveCompany(String store){var ids=repository.findCompanyIds(store);if(ids.size()!=1)throw denied();return ids.getFirst();}
 public Map<String,Boolean> cachedPageRights(String store){var c=cache();return c!=null&&c.pageRightsByStore!=null?c.pageRightsByStore.get(store):null;}
 public void putPageRights(String store,Map<String,Boolean> rights){var c=cache();if(c!=null){if(c.pageRightsByStore==null)c.pageRightsByStore=new HashMap<>();c.pageRightsByStore.put(store,rights);}}
 public boolean admin(long uid,long company){return Boolean.TRUE.equals(repository.isCompanyAdmin(uid, company));}
 public void requireAdmin(String store){if(!admin(user(),company(store)))throw denied();}
 public record Grant(long roleId,String role){}
 // Company admins bypass module grants; PRICE_BOOK has a manager-specific access rule, while other
 // modules require view and optionally edit.
 public Grant grant(long uid,String store,String module,boolean edit){
  long company=company(store);if(admin(uid,company))return new Grant(0,"ADMIN");
  if("PRICE_BOOK".equals(module)){
   var managers=repository.findPriceBookManagers(uid, store);
   if(managers.isEmpty())throw denied();return new Grant(managers.getFirst(),"MANAGER");
  }

  var rows=repository.findModuleGrants(uid, store, module, edit);
  if(rows.isEmpty())throw denied();var r=rows.getFirst();return new Grant(((Number)r.get("user_role_id")).longValue(),(String)r.get("role"));
 }
 public boolean can(Authentication a,String store,String module,boolean edit){try{grant(user(a),store,module,edit);return true;}catch(ResponseStatusException e){return false;}}
 public long module(String code){if(!Set.of("STORE_SETTINGS","DEPARTMENTS","PRICE_BOOK").contains(code))throw denied();return repository.findModuleId(code);}
 // Return null for direct changes, ADMIN for escalated manager changes, or MANAGER_OR_ADMIN for
 // other permitted roles.
 public String required(long uid,String store,String module){var g=grant(uid,store,module,true);if(g.role().equals("ADMIN"))return null;if(!g.role().equals("MANAGER"))return "MANAGER_OR_ADMIN";
  boolean yes=Boolean.TRUE.equals(repository.requiresAdmin(company(store), module(module)));return yes?"ADMIN":null;
 }
 public List<Map<String,Object>> stores(){long uid=user();return repository.findAssignedStores(uid, uid);}
 public void assigned(String store){if(stores().stream().noneMatch(s->store.equals(s.get("dgt_id"))))throw denied();}
 // Write the authenticated actor and company/store scope with structured JSON changes.
 public void audit(String store,String event,String target,String changes){repository.insertAudit(company(store), store, user(), event, "ACCESS", target, changes);}
 public ResponseStatusException denied(){return new ResponseStatusException(HttpStatus.FORBIDDEN,"Access denied for this store or module");}
}
