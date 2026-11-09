package com.dgt.backend.productvendors.dto;

import com.dgt.backend.productvendors.entity.ProductVendor;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

// Response projection for the product vendor link record, including database identity and lifecycle timestamps.
public record ProductVendorResponse(
        Long productVendorId,
        Long productId,
        Long vendorId,
        String vendorSku,
        String unitType,
        String unitOfMeasure,
        BigDecimal unitCost,
        Boolean isPrimary,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static ProductVendorResponse from(ProductVendor e) {
        return new ProductVendorResponse(
                e.getProductVendorId(), e.getProductId(), e.getVendorId(),
                e.getVendorSku(), e.getUnitType(), e.getUnitOfMeasure(),
                e.getUnitCost(), e.getIsPrimary(), e.getArchivedAt(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
