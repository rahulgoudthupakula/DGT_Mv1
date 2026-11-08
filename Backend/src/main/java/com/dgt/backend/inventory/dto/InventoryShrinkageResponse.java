package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.InventoryShrinkage;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored InventoryShrinkage fields.
 */

public record InventoryShrinkageResponse(
        Long shrinkageId,
        String dgtId,
        OffsetDateTime shrinkageDate,
        String reasonType,
        Long createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static InventoryShrinkageResponse from(InventoryShrinkage e) {
        return new InventoryShrinkageResponse(
                e.getShrinkageId(), e.getDgtId(), e.getShrinkageDate(),
                e.getReasonType(), e.getCreatedBy(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
