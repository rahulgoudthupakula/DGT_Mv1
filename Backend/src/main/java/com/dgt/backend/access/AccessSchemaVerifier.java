package com.dgt.backend.access;
import org.springframework.stereotype.Component;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.ApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;
@Component
public class AccessSchemaVerifier implements ApplicationRunner {
 private final JdbcTemplate db;
 public AccessSchemaVerifier(JdbcTemplate db){this.db=db;}
 public void run(ApplicationArguments args){
  db.queryForList("SELECT dgt_id,role_type_id,permission_code,allowed,updated_by,updated_at FROM store_role_permissions WHERE false");
  db.queryForList("SELECT s.company_id,c.company_name,ca.is_active,p.can_view,p.can_edit,mp.manager_requires_admin,a.required_approver,a.expected_versions,a.idempotency_key,e.changes FROM stores s LEFT JOIN companies c ON c.company_id=s.company_id LEFT JOIN company_admins ca ON ca.company_id=c.company_id LEFT JOIN permissions p ON false LEFT JOIN module_approval_policies mp ON false LEFT JOIN approval_requests a ON false LEFT JOIN access_audit_events e ON false WHERE false");
 }
}
