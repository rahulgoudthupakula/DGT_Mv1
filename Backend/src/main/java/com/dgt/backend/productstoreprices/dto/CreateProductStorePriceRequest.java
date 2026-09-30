package com.dgt.backend.productstoreprices.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateProductStorePriceRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @NotNull Long productId,
        BigDecimal retailPrice,
        Boolean isActive,
        Long rebateId
) {}
