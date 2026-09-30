package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateDailyClosingDepositRequest(
        Long everydayClosingId,
        LocalDate depositDate,
        Long bankAccountId,
        BigDecimal amount,
        String receiptUrl,
        Long depositedBy,
        @Size(max = 50) String status
) {}
