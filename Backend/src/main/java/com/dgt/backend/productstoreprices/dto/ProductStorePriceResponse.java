package com.dgt.backend.productstoreprices.dto;

import com.dgt.backend.productstoreprices.entity.ProductStorePrice;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

// Response projection for the product store price record, including database identity and lifecycle timestamps.
public record ProductStorePriceResponse(
        Long storePriceId,
        String dgtId,
        Long productId,
        BigDecimal retailPrice,
        Boolean isActive,
        Long rebateId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static ProductStorePriceResponse from(ProductStorePrice e) {
        return new ProductStorePriceResponse(
                e.getStorePriceId(), e.getDgtId(), e.getProductId(),
                e.getRetailPrice(), e.getIsActive(), e.getRebateId(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
