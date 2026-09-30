package com.dgt.backend.invoices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "invoice_documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvoiceDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_document_id")
    private Long invoiceDocumentId;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "document_type", length = 50)
    private String documentType;

    @Column(name = "file_name", length = 200)
    private String fileName;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    @Column(name = "uploaded_at")
    private OffsetDateTime uploadedAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
