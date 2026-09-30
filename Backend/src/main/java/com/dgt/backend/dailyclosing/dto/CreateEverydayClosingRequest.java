package com.dgt.backend.dailyclosing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record CreateEverydayClosingRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @NotNull OffsetDateTime openingDatetime,
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
