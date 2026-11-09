package com.dgt.backend.productstoreprices.dto;

import jakarta.validation.constraints.NotNull;

// Creation payload for the generic product price-group link API; declared constraints run when validated by the controller.
public record CreateProductPriceGroupRequest(
        @NotNull Long priceGroupId,
        @NotNull Long productId
) {}
