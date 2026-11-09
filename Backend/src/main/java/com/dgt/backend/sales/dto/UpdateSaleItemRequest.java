package com.dgt.backend.sales.dto;

import java.math.BigDecimal;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateSaleItemRequest(
        Long saleId,
        Long productId,
        BigDecimal quantity,
        BigDecimal catalogPrice,
        BigDecimal unitPrice,
        BigDecimal grossAmount,
        BigDecimal discountAmount,
        BigDecimal taxableAmount,
        BigDecimal taxAmount,
        BigDecimal lineTotal
) {}
