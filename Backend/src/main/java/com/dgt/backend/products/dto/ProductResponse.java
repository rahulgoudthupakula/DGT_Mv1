package com.dgt.backend.products.dto;

import com.dgt.backend.products.entity.Product;
import java.time.OffsetDateTime;

public record ProductResponse(
        Long productId,
        Long storeSubDepartmentId,
        String productName,
        String productSku,
        Boolean isReturnable,
        Long brandId,
        String unitOfMeasure,
        Boolean isActive,
        Boolean isTaxable,
        Boolean isEbt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProductResponse from(Product e) {
        return new ProductResponse(
                e.getProductId(), e.getStoreSubDepartmentId(), e.getProductName(),
                e.getProductSku(), e.getIsReturnable(), e.getBrandId(),
                e.getUnitOfMeasure(), e.getIsActive(), e.getIsTaxable(),
                e.getIsEbt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
