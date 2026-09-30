package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateInvoiceAdjustmentRequest(
        @NotNull Long invoiceId,
        @NotBlank @Size(max = 50) String adjustmentType,
        BigDecimal adjustedAmount,
        String reason
) {}
