package com.dgt.backend.inventory.dto;

import java.math.BigDecimal;

public record UpdateInventoryReturnItemRequest(
        Long returnId,
        Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        String reason
) {}
