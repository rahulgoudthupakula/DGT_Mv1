package com.dgt.backend.lottery.dto;

import com.dgt.backend.lottery.entity.LotteryPackInventory;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored LotteryPackInventory fields.
 */

public record LotteryPackInventoryResponse(
        Long lotteryPackInventoryId,
        String dgtId,
        Long shiftOpenedBy,
        OffsetDateTime shiftOpenedAt,
        OffsetDateTime shiftClosedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static LotteryPackInventoryResponse from(LotteryPackInventory e) {
        return new LotteryPackInventoryResponse(
                e.getLotteryPackInventoryId(), e.getDgtId(), e.getShiftOpenedBy(),
                e.getShiftOpenedAt(), e.getShiftClosedAt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
