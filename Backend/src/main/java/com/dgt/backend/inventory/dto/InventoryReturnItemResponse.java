package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.InventoryReturnItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored InventoryReturnItem fields.
 */

public record InventoryReturnItemResponse(
        Long returnItemId,
        Long returnId,
        Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        String reason,
        OffsetDateTime createdAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static InventoryReturnItemResponse from(InventoryReturnItem e) {
        return new InventoryReturnItemResponse(
                e.getReturnItemId(), e.getReturnId(), e.getProductId(),
                e.getQty(), e.getUnitCost(), e.getReason(), e.getCreatedAt());
    }
}
