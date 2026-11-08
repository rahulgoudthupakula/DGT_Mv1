package com.dgt.backend.billing.repository;
import com.dgt.backend.billing.entity.BillingInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA persistence for BillingInvoice.
 * Inherits CRUD and pagination operations; no store-scoped query restriction is added here.
 */
public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, Long> {}
