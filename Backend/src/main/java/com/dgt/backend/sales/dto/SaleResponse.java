package com.dgt.backend.sales.dto;

import com.dgt.backend.sales.entity.Sale;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SaleResponse(
        Long saleId,
        String storeId,
        Long cashierId,
        Long terminalId,
        String receiptNo,
        String transactionId,
        String transactionType,
        String saleStatus,
        OffsetDateTime saleDatetime,
        BigDecimal subtotal,
        BigDecimal taxableAmount,
        BigDecimal taxAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        Integer totalItems,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static SaleResponse from(Sale e) {
        return new SaleResponse(
                e.getSaleId(), e.getStoreId(), e.getCashierId(),
                e.getTerminalId(), e.getReceiptNo(), e.getTransactionId(),
                e.getTransactionType(), e.getSaleStatus(), e.getSaleDatetime(),
                e.getSubtotal(), e.getTaxableAmount(), e.getTaxAmount(),
                e.getDiscountAmount(), e.getTotalAmount(), e.getTotalItems(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
