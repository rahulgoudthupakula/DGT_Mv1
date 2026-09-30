package com.dgt.backend.promotions.dto;

import jakarta.validation.constraints.NotNull;

public record CreatePromotionProductRequest(
        @NotNull Long promotionId,
        @NotNull Long productId
) {}
