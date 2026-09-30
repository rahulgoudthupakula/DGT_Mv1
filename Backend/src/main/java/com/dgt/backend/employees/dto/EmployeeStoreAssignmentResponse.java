package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.EmployeeStoreAssignment;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EmployeeStoreAssignmentResponse(
        Long employeeStoreAssignmentId,
        Long employeeId,
        String dgtId,
        Boolean isPrimary,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        Long roleTypeId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static EmployeeStoreAssignmentResponse from(EmployeeStoreAssignment e) {
        return new EmployeeStoreAssignmentResponse(
                e.getEmployeeStoreAssignmentId(), e.getEmployeeId(), e.getDgtId(),
                e.getIsPrimary(), e.getEffectiveFrom(), e.getEffectiveTo(),
                e.getRoleTypeId(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
