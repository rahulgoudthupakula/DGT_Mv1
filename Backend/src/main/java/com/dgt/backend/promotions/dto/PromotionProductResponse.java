package com.dgt.backend.promotions.dto;

import com.dgt.backend.promotions.entity.PromotionProduct;
import java.time.OffsetDateTime;

public record PromotionProductResponse(
        Long promotionProductId,
        Long promotionId,
        Long productId,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static PromotionProductResponse from(PromotionProduct e) {
        return new PromotionProductResponse(
                e.getPromotionProductId(), e.getPromotionId(), e.getProductId(),
                e.getArchivedAt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
