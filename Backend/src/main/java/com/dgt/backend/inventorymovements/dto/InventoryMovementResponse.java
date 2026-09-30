package com.dgt.backend.inventorymovements.dto;

import com.dgt.backend.inventorymovements.entity.InventoryMovement;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record InventoryMovementResponse(
        Long movementId,
        String dgtId,
        Long productId,
        String movementType,
        BigDecimal qtyChanged,
        BigDecimal unitCost,
        Long referenceId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static InventoryMovementResponse from(InventoryMovement e) {
        return new InventoryMovementResponse(
                e.getMovementId(), e.getDgtId(), e.getProductId(),
                e.getMovementType(), e.getQtyChanged(), e.getUnitCost(),
                e.getReferenceId(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
