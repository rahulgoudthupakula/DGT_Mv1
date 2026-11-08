package com.dgt.backend.productstoreprices.dto;

import com.dgt.backend.productstoreprices.entity.ProductPriceGroup;
import java.time.OffsetDateTime;

// Response projection for the product price-group link record, including database identity and lifecycle timestamps.
public record ProductPriceGroupResponse(
        Long productPriceGroupId,
        Long priceGroupId,
        Long productId,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static ProductPriceGroupResponse from(ProductPriceGroup e) {
        return new ProductPriceGroupResponse(
                e.getProductPriceGroupId(), e.getPriceGroupId(), e.getProductId(),
                e.getArchivedAt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
