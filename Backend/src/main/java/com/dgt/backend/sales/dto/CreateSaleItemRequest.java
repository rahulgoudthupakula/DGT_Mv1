package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateSaleItemRequest(
        @NotNull Long saleId,
        Long productId,
        @NotNull BigDecimal quantity,
        BigDecimal catalogPrice,
        @NotNull BigDecimal unitPrice,
        BigDecimal grossAmount,
        BigDecimal discountAmount,
        BigDecimal taxableAmount,
        BigDecimal taxAmount,
        @NotNull BigDecimal lineTotal
) {}
