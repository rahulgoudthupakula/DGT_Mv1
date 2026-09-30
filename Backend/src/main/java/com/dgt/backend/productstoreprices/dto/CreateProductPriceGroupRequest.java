package com.dgt.backend.productstoreprices.dto;

import jakarta.validation.constraints.NotNull;

public record CreateProductPriceGroupRequest(
        @NotNull Long priceGroupId,
        @NotNull Long productId
) {}
