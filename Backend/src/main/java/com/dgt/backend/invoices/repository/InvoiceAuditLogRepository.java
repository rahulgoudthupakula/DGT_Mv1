package com.dgt.backend.invoices.repository;
import com.dgt.backend.invoices.entity.InvoiceAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InvoiceAuditLogRepository extends JpaRepository<InvoiceAuditLog, Long> {}
