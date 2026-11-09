package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for ScopedAccess. Authorization and transaction boundaries belong to the caller. */
@Repository
public class ScopedAccessRepository {
    private final JdbcTemplate db;
    public ScopedAccessRepository(JdbcTemplate db) { this.db = db; }

    public List<Long> findActiveUserIds(Object email) {
        return db.queryForList("SELECT user_id FROM users WHERE email=? AND account_status='ACTIVE' AND two_factor_authentication=false", Long.class, email);
    }

    public List<Long> findCompanyIds(Object storeId) {
        return db.queryForList("SELECT s.company_id FROM stores s JOIN companies c ON c.company_id=s.company_id WHERE s.dgt_id=? AND c.is_active", Long.class, storeId);
    }

    public Boolean isCompanyAdmin(Object userId, Object companyId) {
        return db.queryForObject("SELECT EXISTS(SELECT 1 FROM company_admins ca JOIN companies c USING(company_id) JOIN users u ON u.user_id=ca.user_id WHERE ca.user_id=? AND ca.company_id=? AND ca.is_active AND c.is_active AND u.account_status='ACTIVE' AND NOT u.two_factor_authentication)", Boolean.class, userId, companyId);
    }

    public List<Long> findPriceBookManagers(Object userId, Object storeId) {
        return db.queryForList("SELECT ur.user_role_id FROM user_roles ur JOIN role_types rt USING(role_type_id) JOIN users u USING(user_id) JOIN store_role_permissions p ON p.dgt_id=ur.dgt_id AND p.role_type_id=ur.role_type_id WHERE ur.user_id=? AND ur.dgt_id=? AND ur.is_active AND rt.is_active AND upper(rt.role_type_name)='MANAGER' AND u.account_status='ACTIVE' AND NOT u.two_factor_authentication AND p.permission_code='PRICE_BOOK_ACCESS' AND p.allowed AND EXISTS(SELECT 1 FROM modules WHERE module_name='PRICE_BOOK' AND is_active)", Long.class, userId, storeId);
    }

    public List<Map<String,Object>> findModuleGrants(Object userId, Object storeId, Object module, Object edit) {
        return db.queryForList("SELECT ur.user_role_id,upper(rt.role_type_name) AS role FROM user_roles ur JOIN role_types rt USING(role_type_id) JOIN store_role_permissions p ON p.dgt_id=ur.dgt_id AND p.role_type_id=ur.role_type_id JOIN modules m ON p.permission_code=m.module_name || '_VIEW' JOIN users u USING(user_id) WHERE ur.user_id=? AND ur.dgt_id=? AND ur.is_active AND rt.is_active AND p.allowed AND m.is_active AND u.account_status='ACTIVE' AND NOT u.two_factor_authentication AND m.module_name=? AND (?=false OR EXISTS(SELECT 1 FROM store_role_permissions ep WHERE ep.dgt_id=ur.dgt_id AND ep.role_type_id=ur.role_type_id AND ep.permission_code=m.module_name || '_EDIT' AND ep.allowed)) AND upper(rt.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT') ORDER BY CASE upper(rt.role_type_name) WHEN 'MANAGER' THEN 0 WHEN 'CASHIER' THEN 1 ELSE 2 END,ur.user_role_id", userId, storeId, module, edit);
    }

    public Long findModuleId(Object code) {
        return db.queryForObject("SELECT module_id FROM modules WHERE module_name=? AND is_active", Long.class, code);
    }

    public Boolean requiresAdmin(Object companyId, Object moduleId) {
        return db.queryForObject("SELECT EXISTS(SELECT 1 FROM module_approval_policies WHERE company_id=? AND module_id=? AND manager_requires_admin)", Boolean.class, companyId, moduleId);
    }

    public List<Map<String,Object>> findAssignedStores(Object adminUserId, Object roleUserId) {
        return db.queryForList("SELECT s.*,s.xmin::text AS _version FROM stores s JOIN companies c ON c.company_id=s.company_id WHERE c.is_active AND (EXISTS(SELECT 1 FROM company_admins ca WHERE ca.company_id=c.company_id AND ca.user_id=? AND ca.is_active) OR EXISTS(SELECT 1 FROM user_roles ur JOIN role_types rt USING(role_type_id) WHERE ur.dgt_id=s.dgt_id AND ur.user_id=? AND ur.is_active AND rt.is_active AND upper(rt.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT'))) ORDER BY s.dgt_id", adminUserId, roleUserId);
    }

    public int insertAudit(Object companyId, Object storeId, Object userId, Object event, Object targetType, Object target, Object changes) {
        return db.update("INSERT INTO access_audit_events(company_id,dgt_id,actor_user_id,event_type,target_type,target_id,changes) VALUES (?,?,?,?,?,?,CAST(? AS jsonb))", companyId, storeId, userId, event, targetType, target, changes);
    }
}
