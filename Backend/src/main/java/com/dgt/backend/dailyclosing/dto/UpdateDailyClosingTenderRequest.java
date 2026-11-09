package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Partial update payload for DailyClosingTender.
 * Null means unchanged in the service, so nullable database fields cannot be cleared through this payload.
 */

public record UpdateDailyClosingTenderRequest(
        Long everydayClosingId,
        @Size(max = 50) String tenderType,
        BigDecimal expectedAmount,
        BigDecimal actualAmount,
        BigDecimal amountDifference,
        Integer transactionCount
) {}
