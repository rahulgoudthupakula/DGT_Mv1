package com.dgt.backend.invoices.repository;
import com.dgt.backend.invoices.entity.InvoiceDocument;
import org.springframework.data.jpa.repository.JpaRepository;
public interface InvoiceDocumentRepository extends JpaRepository<InvoiceDocument, Long> {}
