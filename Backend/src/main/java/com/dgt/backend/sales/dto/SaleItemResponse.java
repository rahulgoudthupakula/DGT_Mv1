package com.dgt.backend.sales.dto;

import com.dgt.backend.sales.entity.SaleItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SaleItemResponse(
        Long salesItemId,
        Long saleId,
        Long productId,
        BigDecimal quantity,
        BigDecimal catalogPrice,
        BigDecimal unitPrice,
        BigDecimal grossAmount,
        BigDecimal discountAmount,
        BigDecimal taxableAmount,
        BigDecimal taxAmount,
        BigDecimal lineTotal,
        OffsetDateTime createdAt
) {
    public static SaleItemResponse from(SaleItem e) {
        return new SaleItemResponse(
                e.getSalesItemId(), e.getSaleId(), e.getProductId(),
                e.getQuantity(), e.getCatalogPrice(), e.getUnitPrice(),
                e.getGrossAmount(), e.getDiscountAmount(), e.getTaxableAmount(),
                e.getTaxAmount(), e.getLineTotal(), e.getCreatedAt());
    }
}
