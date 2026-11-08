package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for PagePermissions. Authorization and transaction boundaries belong to the caller. */
@Repository
public class PagePermissionsRepository {
    private final JdbcTemplate db;
    public PagePermissionsRepository(JdbcTemplate db) { this.db = db; }

    public List<Map<String,Object>> findRoleRights(Object userId, Object storeId) {
        return db.queryForList("SELECT r.role_type_id,p.permission_code,p.allowed FROM user_roles r JOIN role_types t USING(role_type_id) LEFT JOIN store_role_permissions p ON p.dgt_id=r.dgt_id AND p.role_type_id=r.role_type_id WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT')", userId, storeId);
    }

    public List<Map<String,Object>> findOverrides(Object storeId, Object userId) {
        return db.queryForList("SELECT kv.key,kv.value::boolean AS allowed FROM user_store_permission_overrides o CROSS JOIN LATERAL jsonb_each_text(o.overrides) kv WHERE o.dgt_id=? AND o.user_id=?", storeId, userId);
    }
}
