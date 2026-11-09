package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial update payload for EmployeeStatusHistory.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateEmployeeStatusHistoryRequest(
        Long employeeId,
        @Size(max = 50) String status,
        Long statusTypeId
) {}
