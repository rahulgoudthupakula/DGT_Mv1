package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Partial update payload for EmployeeSchedule.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateEmployeeScheduleRequest(
        Long employeeId,
        @Size(max = 50) String dgtId,
        LocalDate workDate,
        OffsetDateTime scheduleStart,
        OffsetDateTime scheduleEnd,
        @Size(max = 50) String status,
        String notes,
        Long createdBy
) {}
