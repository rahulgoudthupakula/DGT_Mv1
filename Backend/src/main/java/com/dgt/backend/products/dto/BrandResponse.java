package com.dgt.backend.products.dto;

import com.dgt.backend.products.entity.Brand;
import java.time.OffsetDateTime;

// Response projection for the brand record, including database identity and lifecycle timestamps.
public record BrandResponse(
        Long brandId,
        String brandName,
        String description,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static BrandResponse from(Brand e) {
        return new BrandResponse(
                e.getBrandId(), e.getBrandName(), e.getDescription(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
