package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.InventoryShrinkage;
import java.time.OffsetDateTime;

public record InventoryShrinkageResponse(
        Long shrinkageId,
        String dgtId,
        OffsetDateTime shrinkageDate,
        String reasonType,
        Long createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static InventoryShrinkageResponse from(InventoryShrinkage e) {
        return new InventoryShrinkageResponse(
                e.getShrinkageId(), e.getDgtId(), e.getShrinkageDate(),
                e.getReasonType(), e.getCreatedBy(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
