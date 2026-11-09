package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Creation payload for EmployeeTimeEntry.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateEmployeeTimeEntryRequest(
        @NotNull Long employeeId,
        @NotBlank @Size(max = 50) String dgtId,
        @NotNull OffsetDateTime clockIn,
        OffsetDateTime clockOut,
        BigDecimal regularHours,
        BigDecimal overtimeHours,
        @Size(max = 50) String eventType
) {}
