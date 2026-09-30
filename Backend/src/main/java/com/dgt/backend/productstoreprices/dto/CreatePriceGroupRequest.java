package com.dgt.backend.productstoreprices.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreatePriceGroupRequest(
        @Size(max = 100) String priceGroupName,
        String description,
        Boolean isActive,
        BigDecimal groupPrice,
        @Size(max = 50) String dgtId
) {}
