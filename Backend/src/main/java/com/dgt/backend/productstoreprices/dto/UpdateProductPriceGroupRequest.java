package com.dgt.backend.productstoreprices.dto;

public record UpdateProductPriceGroupRequest(
        Long priceGroupId,
        Long productId
) {}
