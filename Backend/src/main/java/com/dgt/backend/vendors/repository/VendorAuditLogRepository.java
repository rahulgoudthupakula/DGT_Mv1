package com.dgt.backend.vendors.repository;
import com.dgt.backend.vendors.entity.VendorAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the vendor audit record entity using a Long primary key.
public interface VendorAuditLogRepository extends JpaRepository<VendorAuditLog, Long> {}
