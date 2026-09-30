package com.dgt.backend.lottery.dto;

import com.dgt.backend.lottery.entity.LotteryGame;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record LotteryGameResponse(
        Long lotteryGameId,
        String dgtId,
        String gameCode,
        String gameName,
        BigDecimal ticketPrice,
        Integer ticketsPerPack,
        BigDecimal packValue,
        BigDecimal commissionPercent,
        String status,
        String packNumber,
        String barcode,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static LotteryGameResponse from(LotteryGame e) {
        return new LotteryGameResponse(
                e.getLotteryGameId(), e.getDgtId(), e.getGameCode(),
                e.getGameName(), e.getTicketPrice(), e.getTicketsPerPack(),
                e.getPackValue(), e.getCommissionPercent(), e.getStatus(),
                e.getPackNumber(), e.getBarcode(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
