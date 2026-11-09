package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Creation payload for InventoryReturnItem.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateInventoryReturnItemRequest(
        @NotNull Long returnId,
        @NotNull Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        String reason
) {}
