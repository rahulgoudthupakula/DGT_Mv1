package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for EmployeePermissionService. Authorization and transaction boundaries belong to the caller. */
@Repository
public class EmployeePermissionRepository {
    private final JdbcTemplate db;
    public EmployeePermissionRepository(JdbcTemplate db) { this.db = db; }

    public List<Long> findEmployeeUsers(Object employeeId, Object storeId) {
        return db.queryForList("SELECT DISTINCT e.user_id FROM employees e JOIN employee_store_assignments s USING(employee_id) JOIN users u USING(user_id) WHERE e.employee_id=? AND s.dgt_id=? AND u.account_status='ACTIVE' AND EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.user_id=e.user_id AND r.dgt_id=s.dgt_id AND r.is_active AND t.is_active AND upper(t.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT'))", Long.class, employeeId, storeId);
    }

    public List<Map<String,Object>> findSnapshot(Object storeId, Object userId) {
        return db.queryForList("SELECT overrides::text,xmin::text AS version FROM user_store_permission_overrides WHERE dgt_id=? AND user_id=?", storeId, userId);
    }

    public List<Map<String,Object>> lockCompany(Object companyId) {
        return db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE", companyId);
    }

    public int saveOverrides(Object storeId, Object userId, Object overrides, Object actorUserId) {
        return db.update("INSERT INTO user_store_permission_overrides(dgt_id,user_id,overrides,updated_by) VALUES (?,?,?::jsonb,?) ON CONFLICT(dgt_id,user_id) DO UPDATE SET overrides=EXCLUDED.overrides,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP", storeId, userId, overrides, actorUserId);
    }
}
