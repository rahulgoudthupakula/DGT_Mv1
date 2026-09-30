package com.dgt.backend.sales.dto;

import com.dgt.backend.sales.entity.SalePayment;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SalePaymentResponse(
        Long salePaymentId,
        Long saleId,
        Long tenderTypeId,
        BigDecimal paymentAmount,
        String paymentStatus,
        String cardBrand,
        String cardLast4,
        String processorReference,
        String authorizationCode,
        OffsetDateTime paymentDatetime,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static SalePaymentResponse from(SalePayment e) {
        return new SalePaymentResponse(
                e.getSalePaymentId(), e.getSaleId(), e.getTenderTypeId(),
                e.getPaymentAmount(), e.getPaymentStatus(), e.getCardBrand(),
                e.getCardLast4(), e.getProcessorReference(), e.getAuthorizationCode(),
                e.getPaymentDatetime(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
