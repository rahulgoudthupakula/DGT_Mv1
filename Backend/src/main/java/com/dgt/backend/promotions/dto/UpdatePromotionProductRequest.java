package com.dgt.backend.promotions.dto;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdatePromotionProductRequest(
        Long promotionId,
        Long productId
) {}
