package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record UpdateInvoiceDocumentRequest(
        Long invoiceId,
        @Size(max = 50) String documentType,
        @Size(max = 200) String fileName,
        String fileUrl,
        Long uploadedBy,
        OffsetDateTime uploadedAt
) {}
