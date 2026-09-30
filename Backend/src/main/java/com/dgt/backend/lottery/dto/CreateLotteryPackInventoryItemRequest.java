package com.dgt.backend.lottery.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateLotteryPackInventoryItemRequest(
        @NotNull Long lotteryPackInventoryId,
        Integer openTicketNumber,
        Integer lastSoldTicketNumber,
        Integer physicalQuantity,
        Long packId,
        BigDecimal commissionAmount,
        BigDecimal expectedCash
) {}
