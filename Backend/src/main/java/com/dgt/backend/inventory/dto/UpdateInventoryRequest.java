package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateInventoryRequest(
        @Size(max = 50) String dgtId,
        Long productId,
        BigDecimal availableQuantity,
        BigDecimal cost,
        BigDecimal returnCost
) {}
