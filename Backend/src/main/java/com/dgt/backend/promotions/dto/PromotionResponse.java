package com.dgt.backend.promotions.dto;

import com.dgt.backend.promotions.entity.Promotion;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

// Response projection for the promotion record, including database identity and lifecycle timestamps.
public record PromotionResponse(
        Long promotionId,
        String dgtId,
        String promotionName,
        String promotionType,
        OffsetDateTime startDate,
        OffsetDateTime endDate,
        String status,
        BigDecimal discountValue,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static PromotionResponse from(Promotion e) {
        return new PromotionResponse(
                e.getPromotionId(), e.getDgtId(), e.getPromotionName(),
                e.getPromotionType(), e.getStartDate(), e.getEndDate(),
                e.getStatus(), e.getDiscountValue(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
