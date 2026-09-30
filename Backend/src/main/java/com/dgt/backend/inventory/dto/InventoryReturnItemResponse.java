package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.InventoryReturnItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record InventoryReturnItemResponse(
        Long returnItemId,
        Long returnId,
        Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        String reason,
        OffsetDateTime createdAt
) {
    public static InventoryReturnItemResponse from(InventoryReturnItem e) {
        return new InventoryReturnItemResponse(
                e.getReturnItemId(), e.getReturnId(), e.getProductId(),
                e.getQty(), e.getUnitCost(), e.getReason(), e.getCreatedAt());
    }
}
