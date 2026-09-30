package com.dgt.backend.inventory.dto;

import java.math.BigDecimal;

public record UpdateInventoryShrinkageItemRequest(
        Long shrinkageId,
        Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        BigDecimal lossAmount,
        String reason
) {}
