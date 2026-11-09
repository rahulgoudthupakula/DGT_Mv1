package com.dgt.backend.inventorymovements.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Partial update payload for InventoryMovement.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateInventoryMovementRequest(
        @Size(max = 50) String dgtId,
        Long productId,
        @Size(max = 50) String movementType,
        BigDecimal qtyChanged,
        BigDecimal unitCost,
        Long referenceId
) {}
