package com.dgt.backend.sales.dto;

import com.dgt.backend.sales.entity.SaleItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

// Response projection for the sale item record, including database identity and lifecycle timestamps.
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
    // Copy entity fields into the response without exposing the persistence object itself.
    public static SaleItemResponse from(SaleItem e) {
        return new SaleItemResponse(
                e.getSalesItemId(), e.getSaleId(), e.getProductId(),
                e.getQuantity(), e.getCatalogPrice(), e.getUnitPrice(),
                e.getGrossAmount(), e.getDiscountAmount(), e.getTaxableAmount(),
                e.getTaxAmount(), e.getLineTotal(), e.getCreatedAt());
    }
}
