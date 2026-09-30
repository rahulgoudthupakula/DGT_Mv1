package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateDailyClosingTenderRequest(
        @NotNull Long everydayClosingId,
        @NotBlank @Size(max = 50) String tenderType,
        @NotNull BigDecimal expectedAmount,
        @NotNull BigDecimal actualAmount,
        BigDecimal amountDifference,
        Integer transactionCount
) {}
