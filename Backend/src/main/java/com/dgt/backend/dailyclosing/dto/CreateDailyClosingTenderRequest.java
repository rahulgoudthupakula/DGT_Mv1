package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Generic creation payload for DailyClosingTender.
 * Annotations specify required fields and length limits; amounts are supplied by the caller.
 */

public record CreateDailyClosingTenderRequest(
        @NotNull Long everydayClosingId,
        @NotBlank @Size(max = 50) String tenderType,
        @NotNull BigDecimal expectedAmount,
        @NotNull BigDecimal actualAmount,
        BigDecimal amountDifference,
        Integer transactionCount
) {}
