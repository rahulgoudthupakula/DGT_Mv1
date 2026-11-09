package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Partial update payload for Inventory.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateInventoryRequest(
        @Size(max = 50) String dgtId,
        Long productId,
        BigDecimal availableQuantity,
        BigDecimal cost,
        BigDecimal returnCost
) {}
