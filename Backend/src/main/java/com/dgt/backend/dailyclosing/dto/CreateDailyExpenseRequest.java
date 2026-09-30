package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateDailyExpenseRequest(
        @NotNull Long everydayClosingId,
        @NotNull LocalDate expensesDate,
        @NotBlank @Size(max = 50) String expensesType,
        String description,
        @NotNull BigDecimal amount,
        Long paidBy,
        @Size(max = 100) String receiptNumber
) {}
