package com.dgt.backend.productstoreprices.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdatePriceGroupRequest(
        @Size(max = 100) String priceGroupName,
        String description,
        Boolean isActive,
        BigDecimal groupPrice,
        @Size(max = 50) String dgtId
) {}
