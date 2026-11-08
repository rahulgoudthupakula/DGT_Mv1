package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.Employee;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored Employee fields.
 */

public record EmployeeResponse(
        Long employeeId,
        LocalDate hireDate,
        LocalDate terminationDate,
        String employeeType,
        Long userId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static EmployeeResponse from(Employee e) {
        return new EmployeeResponse(
                e.getEmployeeId(), e.getHireDate(), e.getTerminationDate(),
                e.getEmployeeType(), e.getUserId(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
