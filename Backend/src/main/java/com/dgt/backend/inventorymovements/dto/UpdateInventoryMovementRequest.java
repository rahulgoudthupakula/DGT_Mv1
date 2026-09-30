package com.dgt.backend.inventorymovements.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateInventoryMovementRequest(
        @Size(max = 50) String dgtId,
        Long productId,
        @Size(max = 50) String movementType,
        BigDecimal qtyChanged,
        BigDecimal unitCost,
        Long referenceId
) {}
