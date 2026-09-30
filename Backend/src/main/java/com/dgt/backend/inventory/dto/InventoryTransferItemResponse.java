package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.InventoryTransferItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record InventoryTransferItemResponse(
        Long transferItemId,
        Long transferId,
        Long productId,
        BigDecimal qtySent,
        BigDecimal qtyReceived,
        BigDecimal unitCost,
        OffsetDateTime createdAt
) {
    public static InventoryTransferItemResponse from(InventoryTransferItem e) {
        return new InventoryTransferItemResponse(
                e.getTransferItemId(), e.getTransferId(), e.getProductId(),
                e.getQtySent(), e.getQtyReceived(), e.getUnitCost(), e.getCreatedAt());
    }
}
