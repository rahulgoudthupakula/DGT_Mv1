package com.dgt.backend.inventory.dto;

import java.math.BigDecimal;

/**
 * Partial update payload for InventoryShrinkageItem.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateInventoryShrinkageItemRequest(
        Long shrinkageId,
        Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        BigDecimal lossAmount,
        String reason
) {}
