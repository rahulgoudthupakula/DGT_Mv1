package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateDailyClosingTenderRequest(
        Long everydayClosingId,
        @Size(max = 50) String tenderType,
        BigDecimal expectedAmount,
        BigDecimal actualAmount,
        BigDecimal amountDifference,
        Integer transactionCount
) {}
