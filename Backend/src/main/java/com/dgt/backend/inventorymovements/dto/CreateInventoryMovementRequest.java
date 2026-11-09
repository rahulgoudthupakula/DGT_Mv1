package com.dgt.backend.inventorymovements.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Creation payload for InventoryMovement.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateInventoryMovementRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @NotNull Long productId,
        @NotBlank @Size(max = 50) String movementType,
        BigDecimal qtyChanged,
        BigDecimal unitCost,
        Long referenceId
) {}
