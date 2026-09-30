package com.dgt.backend.invoices.dto;

import com.dgt.backend.invoices.entity.InvoiceCharge;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record InvoiceChargeResponse(
        Long invoiceChargeId,
        Long invoiceId,
        String chargeType,
        BigDecimal subTotal,
        BigDecimal discountedAmount,
        BigDecimal otherCharges,
        BigDecimal totalAmount,
        Long statusId,
        String paymentStatus,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static InvoiceChargeResponse from(InvoiceCharge e) {
        return new InvoiceChargeResponse(
                e.getInvoiceChargeId(), e.getInvoiceId(), e.getChargeType(),
                e.getSubTotal(), e.getDiscountedAmount(), e.getOtherCharges(),
                e.getTotalAmount(), e.getStatusId(), e.getPaymentStatus(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
