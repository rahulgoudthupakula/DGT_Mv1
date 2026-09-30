package com.dgt.backend.invoices.repository;
import com.dgt.backend.invoices.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {}
