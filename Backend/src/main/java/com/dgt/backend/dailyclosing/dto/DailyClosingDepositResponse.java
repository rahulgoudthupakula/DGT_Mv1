package com.dgt.backend.dailyclosing.dto;

import com.dgt.backend.dailyclosing.entity.DailyClosingDeposit;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record DailyClosingDepositResponse(
        Long depositId,
        Long everydayClosingId,
        LocalDate depositDate,
        Long bankAccountId,
        BigDecimal amount,
        String receiptUrl,
        Long depositedBy,
        String status,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static DailyClosingDepositResponse from(DailyClosingDeposit e) {
        return new DailyClosingDepositResponse(
                e.getDepositId(), e.getEverydayClosingId(), e.getDepositDate(),
                e.getBankAccountId(), e.getAmount(), e.getReceiptUrl(),
                e.getDepositedBy(), e.getStatus(), e.getArchivedAt(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
