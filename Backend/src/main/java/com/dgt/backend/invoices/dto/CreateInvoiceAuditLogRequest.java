package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateInvoiceAuditLogRequest(
        @NotNull Long invoiceId,
        @NotBlank @Size(max = 50) String actionType,
        Long actionBy,
        String oldValue,
        String newValue
) {}
