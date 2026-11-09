package com.dgt.backend.inventorymovements.dto;

import com.dgt.backend.inventorymovements.entity.InventoryMovement;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored InventoryMovement fields.
 */

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
    /** Copy entity fields to the response without changing the stored record. */
    public static InventoryMovementResponse from(InventoryMovement e) {
        return new InventoryMovementResponse(
                e.getMovementId(), e.getDgtId(), e.getProductId(),
                e.getMovementType(), e.getQtyChanged(), e.getUnitCost(),
                e.getReferenceId(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
