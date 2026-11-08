package com.dgt.backend.lottery.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Partial update payload for LotteryGame.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateLotteryGameRequest(
        @Size(max = 50) String dgtId,
        @Size(max = 50) String gameCode,
        @Size(max = 100) String gameName,
        BigDecimal ticketPrice,
        Integer ticketsPerPack,
        BigDecimal packValue,
        BigDecimal commissionPercent,
        @Size(max = 50) String status,
        @Size(max = 100) String packNumber,
        @Size(max = 100) String barcode
) {}
