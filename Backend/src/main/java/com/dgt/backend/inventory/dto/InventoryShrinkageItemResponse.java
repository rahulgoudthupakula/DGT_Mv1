package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.InventoryShrinkageItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record InventoryShrinkageItemResponse(
        Long shrinkageItemId,
        Long shrinkageId,
        Long productId,
        BigDecimal qty,
        BigDecimal unitCost,
        BigDecimal lossAmount,
        String reason,
        OffsetDateTime createdAt
) {
    public static InventoryShrinkageItemResponse from(InventoryShrinkageItem e) {
        return new InventoryShrinkageItemResponse(
                e.getShrinkageItemId(), e.getShrinkageId(), e.getProductId(),
                e.getQty(), e.getUnitCost(), e.getLossAmount(), e.getReason(), e.getCreatedAt());
    }
}
