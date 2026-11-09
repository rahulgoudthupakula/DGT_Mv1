package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for RoleAccessService. Authorization and transaction boundaries belong to the caller. */
@Repository
public class RoleAccessRepository {
    private final JdbcTemplate db;
    public RoleAccessRepository(JdbcTemplate db) { this.db = db; }

    public List<Map<String,Object>> findRoles() {
        return db.queryForList("SELECT role_type_id,role_type_name FROM role_types WHERE is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT') ORDER BY CASE role_type_name WHEN 'MANAGER' THEN 0 WHEN 'CASHIER' THEN 1 ELSE 2 END");
    }

    public List<Map<String,Object>> findPermissions(Object storeId) {
        return db.queryForList("SELECT *,xmin::text AS version FROM store_role_permissions WHERE dgt_id=?", storeId);
    }

    public List<Map<String,Object>> lockCompany(Object companyId) {
        return db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE", companyId);
    }

    public List<String> findVersion(Object storeId, Object roleTypeId, Object code) {
        return db.queryForList("SELECT xmin::text FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code=?", String.class, storeId, roleTypeId, code);
    }

    public List<Map<String,Object>> findSupportedRole(Object roleTypeId) {
        return db.queryForList("SELECT role_type_id FROM role_types WHERE role_type_id=? AND is_active AND role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT')", roleTypeId);
    }

    public List<Map<String,Object>> findManagerRole(Object roleTypeId) {
        return db.queryForList("SELECT role_type_id FROM role_types WHERE role_type_id=? AND upper(role_type_name)='MANAGER'", roleTypeId);
    }

    public List<Map<String,Object>> findVersionRow(Object storeId, Object roleTypeId, Object code) {
        return db.queryForList("SELECT xmin::text AS version FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code=?", storeId, roleTypeId, code);
    }

    public Boolean isAllowed(Object storeId, Object roleTypeId, Object code) {
        return db.queryForObject("SELECT EXISTS(SELECT 1 FROM store_role_permissions WHERE dgt_id=? AND role_type_id=? AND permission_code=? AND allowed)", Boolean.class, storeId, roleTypeId, code);
    }

    public int savePermission(Object storeId, Object roleTypeId, Object code, Object allowed, Object userId) {
        return db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed,updated_by) VALUES (?,?,?,?,?) ON CONFLICT(dgt_id,role_type_id,permission_code) DO UPDATE SET allowed=EXCLUDED.allowed,updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP", storeId, roleTypeId, code, allowed, userId);
    }

    public int revokeEdit(Object userId, Object storeId, Object roleTypeId, Object code) {
        return db.update("UPDATE store_role_permissions SET allowed=false,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND role_type_id=? AND permission_code=?", userId, storeId, roleTypeId, code);
    }
}
