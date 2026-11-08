package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Partial update payload for EmployeeStoreAssignment.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateEmployeeStoreAssignmentRequest(
        Long employeeId,
        @Size(max = 50) String dgtId,
        Boolean isPrimary,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        Long roleTypeId
) {}
