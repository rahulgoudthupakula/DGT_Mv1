package com.dgt.backend.promotions.dto;

import jakarta.validation.constraints.NotNull;

// Creation payload for the generic promotion-product link API; declared constraints run when validated by the controller.
public record CreatePromotionProductRequest(
        @NotNull Long promotionId,
        @NotNull Long productId
) {}
