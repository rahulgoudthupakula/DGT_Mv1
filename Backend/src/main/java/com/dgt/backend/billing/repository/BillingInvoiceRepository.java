package com.dgt.backend.billing.repository;
import com.dgt.backend.billing.entity.BillingInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, Long> {}
