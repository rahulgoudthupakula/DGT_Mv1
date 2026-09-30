package com.dgt.backend.invoices.repository;
import com.dgt.backend.invoices.entity.InvoiceCharge;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InvoiceChargeRepository extends JpaRepository<InvoiceCharge, Long> {}
