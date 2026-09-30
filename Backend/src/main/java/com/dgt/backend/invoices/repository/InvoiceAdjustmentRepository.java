package com.dgt.backend.invoices.repository;
import com.dgt.backend.invoices.entity.InvoiceAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InvoiceAdjustmentRepository extends JpaRepository<InvoiceAdjustment, Long> {}
