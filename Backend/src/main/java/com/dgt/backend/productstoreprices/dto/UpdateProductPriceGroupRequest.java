package com.dgt.backend.productstoreprices.dto;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateProductPriceGroupRequest(
        Long priceGroupId,
        Long productId
) {}
