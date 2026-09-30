package com.dgt.backend.vendors.repository;
import com.dgt.backend.vendors.entity.VendorAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
public interface VendorAuditLogRepository extends JpaRepository<VendorAuditLog, Long> {}
