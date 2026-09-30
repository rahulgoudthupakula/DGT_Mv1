package com.dgt.backend.inventory.dto;

import java.math.BigDecimal;

public record UpdateInventoryTransferItemRequest(
        Long transferId,
        Long productId,
        BigDecimal qtySent,
        BigDecimal qtyReceived,
        BigDecimal unitCost
) {}
