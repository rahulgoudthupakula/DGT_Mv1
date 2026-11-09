package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Creation payload for InventoryTransferItem.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateInventoryTransferItemRequest(
        @NotNull Long transferId,
        @NotNull Long productId,
        BigDecimal qtySent,
        BigDecimal qtyReceived,
        BigDecimal unitCost
) {}
