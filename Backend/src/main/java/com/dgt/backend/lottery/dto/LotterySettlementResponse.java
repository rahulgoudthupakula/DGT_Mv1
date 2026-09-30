package com.dgt.backend.lottery.dto;

import com.dgt.backend.lottery.entity.LotterySettlement;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record LotterySettlementResponse(
        Long lotterySettlementId,
        String dgtId,
        Long vendorId,
        String settlementReference,
        JsonNode periodType,
        LocalDate periodStartDate,
        LocalDate periodEndDate,
        BigDecimal totalSales,
        BigDecimal totalCommission,
        Long statusTypeId,
        Long createdBy,
        OffsetDateTime paidAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static LotterySettlementResponse from(LotterySettlement e) {
        return new LotterySettlementResponse(
                e.getLotterySettlementId(), e.getDgtId(), e.getVendorId(),
                e.getSettlementReference(), e.getPeriodType(), e.getPeriodStartDate(),
                e.getPeriodEndDate(), e.getTotalSales(), e.getTotalCommission(),
                e.getStatusTypeId(), e.getCreatedBy(), e.getPaidAt(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
