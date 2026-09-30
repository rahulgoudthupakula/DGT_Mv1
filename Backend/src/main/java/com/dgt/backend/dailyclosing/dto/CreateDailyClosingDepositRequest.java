package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateDailyClosingDepositRequest(
        @NotNull Long everydayClosingId,
        @NotNull LocalDate depositDate,
        Long bankAccountId,
        @NotNull BigDecimal amount,
        String receiptUrl,
        Long depositedBy,
        @NotBlank @Size(max = 50) String status
) {}
