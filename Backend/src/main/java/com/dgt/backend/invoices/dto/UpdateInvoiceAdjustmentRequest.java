package com.dgt.backend.invoices.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateInvoiceAdjustmentRequest(
        Long invoiceId,
        @Size(max = 50) String adjustmentType,
        BigDecimal adjustedAmount,
        String reason
) {}
