package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateDailyExpenseRequest(
        Long everydayClosingId,
        LocalDate expensesDate,
        @Size(max = 50) String expensesType,
        String description,
        BigDecimal amount,
        Long paidBy,
        @Size(max = 100) String receiptNumber
) {}
