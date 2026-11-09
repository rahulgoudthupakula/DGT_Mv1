package com.dgt.backend.dailyclosing.dto;

import com.dgt.backend.dailyclosing.entity.DailyClosingTender;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * API representation of stored DailyClosingTender values, without recalculating closing totals.
 */

public record DailyClosingTenderResponse(
        Long tenderId,
        Long everydayClosingId,
        String tenderType,
        BigDecimal expectedAmount,
        BigDecimal actualAmount,
        BigDecimal amountDifference,
        Integer transactionCount,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity values into the response without additional database queries. */
    public static DailyClosingTenderResponse from(DailyClosingTender e) {
        return new DailyClosingTenderResponse(
                e.getTenderId(), e.getEverydayClosingId(), e.getTenderType(),
                e.getExpectedAmount(), e.getActualAmount(), e.getAmountDifference(),
                e.getTransactionCount(), e.getArchivedAt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
