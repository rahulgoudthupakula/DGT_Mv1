package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateInventoryReturnItemRequest(
        @NotNull Long returnId,
        @NotNull Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        String reason
) {}
