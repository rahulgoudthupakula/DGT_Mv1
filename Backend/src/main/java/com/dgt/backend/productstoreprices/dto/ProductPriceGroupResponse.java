package com.dgt.backend.productstoreprices.dto;

import com.dgt.backend.productstoreprices.entity.ProductPriceGroup;
import java.time.OffsetDateTime;

public record ProductPriceGroupResponse(
        Long productPriceGroupId,
        Long priceGroupId,
        Long productId,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProductPriceGroupResponse from(ProductPriceGroup e) {
        return new ProductPriceGroupResponse(
                e.getProductPriceGroupId(), e.getPriceGroupId(), e.getProductId(),
                e.getArchivedAt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
