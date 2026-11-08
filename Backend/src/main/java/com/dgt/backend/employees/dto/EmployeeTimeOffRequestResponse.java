package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.EmployeeTimeOffRequest;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored EmployeeTimeOffRequest fields.
 */

public record EmployeeTimeOffRequestResponse(
        Long timeOffRequestId,
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
        String rejectedReason,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static EmployeeTimeOffRequestResponse from(EmployeeTimeOffRequest e) {
        return new EmployeeTimeOffRequestResponse(
                e.getTimeOffRequestId(), e.getEmployeeId(), e.getRequestType(),
                e.getStartDate(), e.getEndDate(), e.getHoursRequested(),
                e.getReason(), e.getStatusTypeId(), e.getRequestedAt(),
                e.getReviewedBy(), e.getReviewedAt(), e.getRejectedReason(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
