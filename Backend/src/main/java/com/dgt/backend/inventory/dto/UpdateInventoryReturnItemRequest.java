package com.dgt.backend.inventory.dto;

import java.math.BigDecimal;

/**
 * Partial update payload for InventoryReturnItem.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateInventoryReturnItemRequest(
        Long returnId,
        Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        String reason
) {}
