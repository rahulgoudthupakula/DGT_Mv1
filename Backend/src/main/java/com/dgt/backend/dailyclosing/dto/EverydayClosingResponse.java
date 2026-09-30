package com.dgt.backend.dailyclosing.dto;

import com.dgt.backend.dailyclosing.entity.EverydayClosing;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record EverydayClosingResponse(
        Long everydayClosingId,
        String dgtId,
        OffsetDateTime openingDatetime,
        OffsetDateTime closingDatetime,
        BigDecimal totalGrossSales,
        BigDecimal totalDiscounts,
        BigDecimal totalTax,
        BigDecimal totalNetSales,
        BigDecimal totalRefunds,
        BigDecimal expectedCash,
        BigDecimal actualCash,
        BigDecimal cashVariance,
        BigDecimal totalDeposits,
        Long closedBy,
        OffsetDateTime updatedAt
) {
    public static EverydayClosingResponse from(EverydayClosing e) {
        return new EverydayClosingResponse(
                e.getEverydayClosingId(), e.getDgtId(), e.getOpeningDatetime(),
                e.getClosingDatetime(), e.getTotalGrossSales(), e.getTotalDiscounts(),
                e.getTotalTax(), e.getTotalNetSales(), e.getTotalRefunds(),
                e.getExpectedCash(), e.getActualCash(), e.getCashVariance(),
                e.getTotalDeposits(), e.getClosedBy(), e.getUpdatedAt());
    }
}
