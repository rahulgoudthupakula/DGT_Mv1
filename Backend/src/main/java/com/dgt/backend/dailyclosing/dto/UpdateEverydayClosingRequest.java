package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Partial update payload for EverydayClosing.
 * Null means unchanged in the service, so nullable database fields cannot be cleared through this payload.
 */

public record UpdateEverydayClosingRequest(
        @Size(max = 50) String dgtId,
        OffsetDateTime openingDatetime,
        OffsetDateTime closingDatetime,
        BigDecimal totalGrossSales,
        BigDecimal totalDiscounts,
        BigDecimal totalTax,
        BigDecimal totalNetSales,
        BigDecimal totalRefunds,
        BigDecimal expectedCash,
        BigDecimal actualCash,
        BigDecimal cashVariance,
        BigDecimal totalDeposits,
        Long closedBy
) {}
