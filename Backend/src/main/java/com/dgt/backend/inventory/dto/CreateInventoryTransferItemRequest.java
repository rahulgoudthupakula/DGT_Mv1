package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateInventoryTransferItemRequest(
        @NotNull Long transferId,
        @NotNull Long productId,
        BigDecimal qtySent,
        BigDecimal qtyReceived,
        BigDecimal unitCost
) {}
