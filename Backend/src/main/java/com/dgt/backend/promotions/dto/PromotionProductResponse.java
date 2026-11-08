package com.dgt.backend.promotions.dto;

import com.dgt.backend.promotions.entity.PromotionProduct;
import java.time.OffsetDateTime;

// Response projection for the promotion-product link record, including database identity and lifecycle timestamps.
public record PromotionProductResponse(
        Long promotionProductId,
        Long promotionId,
        Long productId,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static PromotionProductResponse from(PromotionProduct e) {
        return new PromotionProductResponse(
                e.getPromotionProductId(), e.getPromotionId(), e.getProductId(),
                e.getArchivedAt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
