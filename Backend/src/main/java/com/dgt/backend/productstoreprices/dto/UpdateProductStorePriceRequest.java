package com.dgt.backend.productstoreprices.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateProductStorePriceRequest(
        @Size(max = 50) String dgtId,
        Long productId,
        BigDecimal retailPrice,
        Boolean isActive,
        Long rebateId
) {}
