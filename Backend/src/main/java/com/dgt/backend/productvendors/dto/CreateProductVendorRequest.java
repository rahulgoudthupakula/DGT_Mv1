package com.dgt.backend.productvendors.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateProductVendorRequest(
        @NotNull Long productId,
        @NotNull Long vendorId,
        @Size(max = 100) String vendorSku,
        @Size(max = 50) String unitType,
        @Size(max = 50) String unitOfMeasure,
        BigDecimal unitCost,
        Boolean isPrimary
) {}
