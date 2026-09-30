package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateInventoryShrinkageItemRequest(
        @NotNull Long shrinkageId,
        @NotNull Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        BigDecimal lossAmount,
        String reason
) {}
