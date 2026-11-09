package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for AccessService. Authorization and transaction boundaries belong to the caller. */
@Repository
public class AccessRepository {
    private final JdbcTemplate db;
    public AccessRepository(JdbcTemplate db) { this.db = db; }

    public List<String> findUserRoles(Object userId, Object storeId) {
        return db.queryForList("SELECT DISTINCT upper(t.role_type_name) FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active", String.class, userId, storeId);
    }

    public List<Map<String,Object>> findCompanyUsers(Object companyId) {
        return db.queryForList("SELECT u.user_id,u.email FROM users u JOIN stores s ON s.dgt_id=u.dgt_id WHERE s.company_id=? AND u.account_status='ACTIVE' AND NOT u.two_factor_authentication ORDER BY u.email", companyId);
    }

    public List<Map<String,Object>> findRoles() {
        return db.queryForList("SELECT role_type_id,role_type_name FROM role_types WHERE is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT') ORDER BY role_type_name");
    }

    public List<Map<String,Object>> findAssignments(Object storeId) {
        return db.queryForList("SELECT ur.user_role_id,ur.user_id,ur.role_type_id,u.email,rt.role_type_name,ur.is_active,ur.xmin::text AS version FROM user_roles ur JOIN users u USING(user_id) JOIN role_types rt USING(role_type_id) WHERE ur.dgt_id=? ORDER BY u.email,rt.role_type_name", storeId);
    }

    public List<Map<String,Object>> findLegacyPermissions(Object storeId) {
        return db.queryForList("SELECT p.*,p.xmin::text AS version,m.module_name FROM permissions p JOIN user_roles ur USING(user_role_id) JOIN modules m USING(module_id) WHERE ur.dgt_id=? AND m.module_name IN ('STORE_SETTINGS','DEPARTMENTS','PRICE_BOOK')", storeId);
    }

    public List<Map<String,Object>> findModules() {
        return db.queryForList("SELECT module_id,module_name FROM modules WHERE is_active AND module_name IN ('STORE_SETTINGS','DEPARTMENTS','PRICE_BOOK') ORDER BY module_id");
    }

    public List<Map<String,Object>> findPolicies(Object companyId) {
        return db.queryForList("SELECT module_id,manager_requires_admin,xmin::text AS version FROM module_approval_policies WHERE company_id=?", companyId);
    }

    public List<String> findModuleNames(Object moduleId) {
        return db.queryForList("SELECT module_name FROM modules WHERE module_id=?", String.class, moduleId);
    }

    public List<Map<String,Object>> findPolicyVersion(Object companyId, Object moduleId) {
        return db.queryForList("SELECT xmin::text AS version FROM module_approval_policies WHERE company_id=? AND module_id=?", companyId, moduleId);
    }

    public int savePolicy(Object companyId, Object moduleId, Object required, Object actorUserId) {
        return db.update("INSERT INTO module_approval_policies(company_id,module_id,manager_requires_admin,updated_by) VALUES (?,?,?,?) ON CONFLICT(company_id,module_id) DO UPDATE SET manager_requires_admin=EXCLUDED.manager_requires_admin,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP", companyId, moduleId, required, actorUserId);
    }

    public List<Map<String,Object>> findCompanyUser(Object userId, Object companyId) {
        return db.queryForList("SELECT u.user_id FROM users u JOIN stores s ON s.dgt_id=u.dgt_id WHERE u.user_id=? AND s.company_id=?", userId, companyId);
    }

    public List<String> findRoleNames(Object roleTypeId) {
        return db.queryForList("SELECT role_type_name FROM role_types WHERE role_type_id=? AND is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT')", String.class, roleTypeId);
    }

    public List<Map<String,Object>> findAssignmentVersion(Object userId, Object roleTypeId, Object storeId) {
        return db.queryForList("SELECT xmin::text AS version FROM user_roles WHERE user_id=? AND role_type_id=? AND dgt_id=?", userId, roleTypeId, storeId);
    }

    public Long saveAssignment(Object userId, Object roleTypeId, Object storeId, Object active) {
        return db.queryForObject("INSERT INTO user_roles(user_id,role_type_id,dgt_id,is_active) VALUES (?,?,?,?) ON CONFLICT(user_id,role_type_id,dgt_id) DO UPDATE SET is_active=EXCLUDED.is_active,updated_at=CURRENT_TIMESTAMP RETURNING user_role_id", Long.class, userId, roleTypeId, storeId, active);
    }

    public Boolean accountExists(Object email, Object storeId, Object employeeId) {
        return db.queryForObject("SELECT EXISTS(SELECT 1 FROM users WHERE lower(email)=? OR (dgt_id=? AND employee_id=?))", Boolean.class, email, storeId, employeeId);
    }

    public Long insertUser(Object storeId, Object employeeId, Object firstName, Object lastName, Object email, Object passwordHash) {
        return db.queryForObject("INSERT INTO users(dgt_id,employee_id,first_name,last_name,email,password_hash) VALUES (?,?,?,?,?,?) RETURNING user_id", Long.class, storeId, employeeId, firstName, lastName, email, passwordHash);
    }

    public Long insertAssignment(Object userId, Object roleTypeId, Object storeId) {
        return db.queryForObject("INSERT INTO user_roles(user_id,role_type_id,dgt_id,is_active) VALUES (?,?,?,true) RETURNING user_role_id", Long.class, userId, roleTypeId, storeId);
    }

    public List<Map<String,Object>> lockCompany(Object companyId) {
        return db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE", companyId);
    }
}
