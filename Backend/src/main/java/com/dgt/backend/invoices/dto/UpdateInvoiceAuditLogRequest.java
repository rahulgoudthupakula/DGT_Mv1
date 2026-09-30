package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.Size;

public record UpdateInvoiceAuditLogRequest(
        Long invoiceId,
        @Size(max = 50) String actionType,
        Long actionBy,
        String oldValue,
        String newValue
) {}
