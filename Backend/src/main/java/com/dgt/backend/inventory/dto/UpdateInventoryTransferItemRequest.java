package com.dgt.backend.inventory.dto;

import java.math.BigDecimal;

/**
 * Partial update payload for InventoryTransferItem.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateInventoryTransferItemRequest(
        Long transferId,
        Long productId,
        BigDecimal qtySent,
        BigDecimal qtyReceived,
        BigDecimal unitCost
) {}
