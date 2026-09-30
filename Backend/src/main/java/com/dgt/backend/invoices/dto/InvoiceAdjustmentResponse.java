package com.dgt.backend.invoices.dto;

import com.dgt.backend.invoices.entity.InvoiceAdjustment;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record InvoiceAdjustmentResponse(
        Long invoiceAdjustmentId,
        Long invoiceId,
        String adjustmentType,
        BigDecimal adjustedAmount,
        String reason,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static InvoiceAdjustmentResponse from(InvoiceAdjustment e) {
        return new InvoiceAdjustmentResponse(
                e.getInvoiceAdjustmentId(), e.getInvoiceId(), e.getAdjustmentType(),
                e.getAdjustedAmount(), e.getReason(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
