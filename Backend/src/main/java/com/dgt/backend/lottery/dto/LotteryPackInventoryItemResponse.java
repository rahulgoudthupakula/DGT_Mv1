package com.dgt.backend.lottery.dto;

import com.dgt.backend.lottery.entity.LotteryPackInventoryItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored LotteryPackInventoryItem fields.
 */

public record LotteryPackInventoryItemResponse(
        Long lotteryPackInventoryItemId,
        Long lotteryPackInventoryId,
        Integer openTicketNumber,
        Integer lastSoldTicketNumber,
        Integer physicalQuantity,
        Long packId,
        BigDecimal commissionAmount,
        BigDecimal expectedCash,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static LotteryPackInventoryItemResponse from(LotteryPackInventoryItem e) {
        return new LotteryPackInventoryItemResponse(
                e.getLotteryPackInventoryItemId(), e.getLotteryPackInventoryId(),
                e.getOpenTicketNumber(), e.getLastSoldTicketNumber(),
                e.getPhysicalQuantity(), e.getPackId(), e.getCommissionAmount(),
                e.getExpectedCash(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
