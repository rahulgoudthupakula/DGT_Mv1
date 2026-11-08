package com.dgt.backend.productstoreprices.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

// Creation payload for the generic price group API; declared constraints run when validated by the controller.
public record CreatePriceGroupRequest(
        @Size(max = 100) String priceGroupName,
        String description,
        Boolean isActive,
        BigDecimal groupPrice,
        @Size(max = 50) String dgtId
) {}
