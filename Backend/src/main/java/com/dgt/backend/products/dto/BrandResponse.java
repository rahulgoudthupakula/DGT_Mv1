package com.dgt.backend.products.dto;

import com.dgt.backend.products.entity.Brand;
import java.time.OffsetDateTime;

public record BrandResponse(
        Long brandId,
        String brandName,
        String description,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static BrandResponse from(Brand e) {
        return new BrandResponse(
                e.getBrandId(), e.getBrandName(), e.getDescription(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
