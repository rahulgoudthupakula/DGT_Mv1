package com.dgt.backend.employees.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateEmployeeTimeOffRequestRequest(
        @NotNull Long employeeId,
        JsonNode requestType,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        BigDecimal hoursRequested,
        String reason,
        Long statusTypeId,
        OffsetDateTime requestedAt,
        Long reviewedBy,
        OffsetDateTime reviewedAt,
        String rejectedReason
) {}
