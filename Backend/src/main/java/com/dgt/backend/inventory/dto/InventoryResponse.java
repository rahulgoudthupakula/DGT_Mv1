package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.Inventory;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

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
    public static InventoryResponse from(Inventory e) {
        return new InventoryResponse(
                e.getInventoryId(), e.getDgtId(), e.getProductId(),
                e.getAvailableQuantity(), e.getCost(), e.getReturnCost(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
