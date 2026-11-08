package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for ChildStoreService. Authorization and transaction boundaries belong to the caller. */
@Repository
public class ChildStoreRepository {
    private final JdbcTemplate db;
    public ChildStoreRepository(JdbcTemplate db) { this.db = db; }

    public List<Map<String,Object>> findCompanyStores(Object companyId) {
        return db.queryForList("SELECT s.dgt_id,s.store_id,s.store_name,s.timezone,s.parent_store_dgt_id,p.store_name AS parent_store_name,c.address FROM stores s LEFT JOIN stores p ON p.dgt_id=s.parent_store_dgt_id LEFT JOIN LATERAL(SELECT address FROM store_contact_info WHERE dgt_id=s.dgt_id ORDER BY contact_info_id LIMIT 1)c ON true WHERE s.company_id=? ORDER BY s.store_name,s.dgt_id", companyId);
    }

    public List<Map<String,Object>> lockCompany(Object companyId) {
        return db.queryForList("SELECT company_id FROM companies WHERE company_id=? FOR UPDATE", companyId);
    }

    public List<Map<String,Object>> findCreationRequest(Object companyId, Object requestKey) {
        return db.queryForList("SELECT dgt_id,request_payload::text,actor_user_id FROM store_creation_requests WHERE company_id=? AND request_key=?", companyId, requestKey);
    }

    public Boolean storeDetailsExist(Object storeId, Object licenseNumber) {
        return db.queryForObject("SELECT EXISTS(SELECT 1 FROM stores WHERE store_id=? OR license_number=?)", Boolean.class, storeId, licenseNumber);
    }

    public String insertStore(Object storeId, Object storeName, Object legalBusinessName, Object taxId, Object licenseNumber, Object timezone, Object companyId, Object parentStoreId) {
        return db.queryForObject("INSERT INTO stores(store_id,store_name,legal_business_name,tax_id,license_number,timezone,company_id,parent_store_dgt_id) VALUES (?,?,?,?,?,?,?,?) RETURNING dgt_id", String.class, storeId, storeName, legalBusinessName, taxId, licenseNumber, timezone, companyId, parentStoreId);
    }

    public int insertContact(Object dgtId, Object storeName, Object address, Object phone, Object email) {
        return db.update("INSERT INTO store_contact_info(dgt_id,store_name,address,phone_number,email) VALUES (?,?,?,?,?)", dgtId, storeName, address, phone, email);
    }

    public int insertBusinessDay(Object dgtId, Object day) {
        return db.update("INSERT INTO store_business_hours(dgt_id,day_of_week,status) VALUES (?,?,'UNSET')", dgtId, day);
    }

    public int copyParentPermissions(Object dgtId, Object actorUserId, Object parentStoreId) {
        return db.update("INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed,updated_by) SELECT ?,role_type_id,permission_code,allowed,? FROM store_role_permissions WHERE dgt_id=?", dgtId, actorUserId, parentStoreId);
    }

    public int insertCreationRequest(Object companyId, Object requestKey, Object actorUserId, Object payload, Object dgtId) {
        return db.update("INSERT INTO store_creation_requests(company_id,request_key,actor_user_id,request_payload,dgt_id) VALUES (?,?,?,?::jsonb,?)", companyId, requestKey, actorUserId, payload, dgtId);
    }
}
