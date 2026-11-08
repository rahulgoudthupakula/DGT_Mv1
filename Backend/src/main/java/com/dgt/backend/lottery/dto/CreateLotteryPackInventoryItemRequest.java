package com.dgt.backend.lottery.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Creation payload for LotteryPackInventoryItem.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateLotteryPackInventoryItemRequest(
        @NotNull Long lotteryPackInventoryId,
        Integer openTicketNumber,
        Integer lastSoldTicketNumber,
        Integer physicalQuantity,
        Long packId,
        BigDecimal commissionAmount,
        BigDecimal expectedCash
) {}
