package com.dgt.backend.promotions.dto;

public record UpdatePromotionProductRequest(
        Long promotionId,
        Long productId
) {}
