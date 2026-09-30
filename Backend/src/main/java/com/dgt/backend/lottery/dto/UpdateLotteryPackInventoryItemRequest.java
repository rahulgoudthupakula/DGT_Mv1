package com.dgt.backend.lottery.dto;

import java.math.BigDecimal;

public record UpdateLotteryPackInventoryItemRequest(
        Long lotteryPackInventoryId,
        Integer openTicketNumber,
        Integer lastSoldTicketNumber,
        Integer physicalQuantity,
        Long packId,
        BigDecimal commissionAmount,
        BigDecimal expectedCash
) {}
