package com.dgt.backend.lottery.dto;

import java.math.BigDecimal;

/**
 * Partial update payload for LotteryPackInventoryItem.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateLotteryPackInventoryItemRequest(
        Long lotteryPackInventoryId,
        Integer openTicketNumber,
        Integer lastSoldTicketNumber,
        Integer physicalQuantity,
        Long packId,
        BigDecimal commissionAmount,
        BigDecimal expectedCash
) {}
