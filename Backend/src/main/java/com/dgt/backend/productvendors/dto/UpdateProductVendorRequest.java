package com.dgt.backend.productvendors.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateProductVendorRequest(
        Long productId,
        Long vendorId,
        @Size(max = 100) String vendorSku,
        @Size(max = 50) String unitType,
        @Size(max = 50) String unitOfMeasure,
        BigDecimal unitCost,
        Boolean isPrimary
) {}
