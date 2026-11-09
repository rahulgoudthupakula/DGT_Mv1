package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for ApprovalService. Authorization and transaction boundaries belong to the caller. */
@Repository
public class ApprovalRepository {
    private final JdbcTemplate db;
    public ApprovalRepository(JdbcTemplate db) { this.db = db; }

    public List<Map<String,Object>> findByRetryKey(Object userId, Object retryKey) {
        return db.queryForList("SELECT * FROM approval_requests WHERE requested_by=? AND idempotency_key=?", userId, retryKey);
    }

    public Long insertRequest(Object companyId, Object storeId, Object moduleId, Object userId, Object roleId, Object requiredApprover, Object operation, Object target, Object versions, Object payload, Object retryKey) {
        return db.queryForObject("INSERT INTO approval_requests(company_id,dgt_id,module_id,requested_by,requester_role_id,required_approver,operation_code,target_id,expected_versions,proposed_values,idempotency_key) VALUES (?,?,?,?,?,?,?,?,CAST(? AS jsonb),CAST(? AS jsonb),?) RETURNING request_id", Long.class, companyId, storeId, moduleId, userId, roleId, requiredApprover, operation, target, versions, payload, retryKey);
    }

    public List<Map<String,Object>> findRequests(Object storeId, Object companyId) {
        return db.queryForList("SELECT a.*,u.email AS requester_email FROM approval_requests a JOIN users u ON u.user_id=a.requested_by WHERE a.dgt_id=? AND a.company_id=? ORDER BY a.created_at DESC LIMIT 200", storeId, companyId);
    }

    public List<String> findDefaultDepartmentName(Object departmentId) {
        return db.queryForList("SELECT department_name FROM departments WHERE department_id=?", String.class, departmentId);
    }

    public List<String> findStoreDepartmentName(Object departmentId, Object storeId) {
        return db.queryForList("SELECT store_department_name FROM store_departments WHERE store_department_id=? AND dgt_id=?", String.class, departmentId, storeId);
    }

    public List<Map<String,Object>> lockRequest(Object requestId, Object storeId, Object companyId) {
        return db.queryForList("SELECT * FROM approval_requests WHERE request_id=? AND dgt_id=? AND company_id=? FOR UPDATE", requestId, storeId, companyId);
    }

    public int recordDecision(Object decision, Object reviewerId, Object note, Object requestId) {
        return db.update("UPDATE approval_requests SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_note=? WHERE request_id=?", decision, reviewerId, note, requestId);
    }

    public List<Map<String,Object>> lockCompany(Object companyId) {
        return db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE", companyId);
    }
}
