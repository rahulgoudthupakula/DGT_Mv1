package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Partial update payload for Employee.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateEmployeeRequest(
        LocalDate hireDate,
        LocalDate terminationDate,
        @Size(max = 50) String employeeType,
        Long userId
) {}
