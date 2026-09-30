package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.EmployeeStatusHistory;

public record EmployeeStatusHistoryResponse(
        Long statusHistoryId,
        Long employeeId,
        String status,
        Long statusTypeId
) {
    public static EmployeeStatusHistoryResponse from(EmployeeStatusHistory e) {
        return new EmployeeStatusHistoryResponse(
                e.getStatusHistoryId(), e.getEmployeeId(), e.getStatus(), e.getStatusTypeId());
    }
}
