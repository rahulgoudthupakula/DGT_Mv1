package com.dgt.backend.dailyclosing.dto;

import com.dgt.backend.dailyclosing.entity.DailyExpense;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * API representation of stored DailyExpense values, without recalculating closing totals.
 */

public record DailyExpenseResponse(
        Long expensesId,
        Long everydayClosingId,
        LocalDate expensesDate,
        String expensesType,
        String description,
        BigDecimal amount,
        Long paidBy,
        String receiptNumber,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity values into the response without additional database queries. */
    public static DailyExpenseResponse from(DailyExpense e) {
        return new DailyExpenseResponse(
                e.getExpensesId(), e.getEverydayClosingId(), e.getExpensesDate(),
                e.getExpensesType(), e.getDescription(), e.getAmount(),
                e.getPaidBy(), e.getReceiptNumber(), e.getArchivedAt(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
