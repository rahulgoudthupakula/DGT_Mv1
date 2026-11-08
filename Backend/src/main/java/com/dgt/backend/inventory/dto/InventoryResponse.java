package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.Inventory;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored Inventory fields.
 */

public record InventoryResponse(
        Long inventoryId,
        String dgtId,
        Long productId,
        BigDecimal availableQuantity,
        BigDecimal cost,
        BigDecimal returnCost,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static InventoryResponse from(Inventory e) {
        return new InventoryResponse(
                e.getInventoryId(), e.getDgtId(), e.getProductId(),
                e.getAvailableQuantity(), e.getCost(), e.getReturnCost(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
