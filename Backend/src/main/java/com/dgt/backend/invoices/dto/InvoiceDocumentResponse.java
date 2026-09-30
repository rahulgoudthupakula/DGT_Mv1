package com.dgt.backend.invoices.dto;

import com.dgt.backend.invoices.entity.InvoiceDocument;
import java.time.OffsetDateTime;

public record InvoiceDocumentResponse(
        Long invoiceDocumentId,
        Long invoiceId,
        String documentType,
        String fileName,
        String fileUrl,
        Long uploadedBy,
        OffsetDateTime uploadedAt,
        OffsetDateTime updatedAt
) {
    public static InvoiceDocumentResponse from(InvoiceDocument e) {
        return new InvoiceDocumentResponse(
                e.getInvoiceDocumentId(), e.getInvoiceId(), e.getDocumentType(),
                e.getFileName(), e.getFileUrl(), e.getUploadedBy(),
                e.getUploadedAt(), e.getUpdatedAt());
    }
}
