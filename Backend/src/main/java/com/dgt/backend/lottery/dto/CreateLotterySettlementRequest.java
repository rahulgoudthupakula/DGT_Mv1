package com.dgt.backend.lottery.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateLotterySettlementRequest(
        @NotBlank @Size(max = 50) String dgtId,
        Long vendorId,
        @Size(max = 100) String settlementReference,
        JsonNode periodType,
        LocalDate periodStartDate,
        LocalDate periodEndDate,
        BigDecimal totalSales,
        BigDecimal totalCommission,
        Long statusTypeId,
        Long createdBy,
        OffsetDateTime paidAt
) {}
