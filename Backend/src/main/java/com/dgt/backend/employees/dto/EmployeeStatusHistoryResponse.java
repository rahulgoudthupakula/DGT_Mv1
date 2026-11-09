package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.EmployeeStatusHistory;

/**
 * Response DTO for stored EmployeeStatusHistory fields.
 */

public record EmployeeStatusHistoryResponse(
        Long statusHistoryId,
        Long employeeId,
        String status,
        Long statusTypeId
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static EmployeeStatusHistoryResponse from(EmployeeStatusHistory e) {
        return new EmployeeStatusHistoryResponse(
                e.getStatusHistoryId(), e.getEmployeeId(), e.getStatus(), e.getStatusTypeId());
    }
}
