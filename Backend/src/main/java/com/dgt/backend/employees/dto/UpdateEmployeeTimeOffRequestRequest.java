package com.dgt.backend.employees.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Partial update payload for EmployeeTimeOffRequest.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateEmployeeTimeOffRequestRequest(
        Long employeeId,
        JsonNode requestType,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal hoursRequested,
        String reason,
        Long statusTypeId,
        OffsetDateTime requestedAt,
        Long reviewedBy,
        OffsetDateTime reviewedAt,
        String rejectedReason
) {}
