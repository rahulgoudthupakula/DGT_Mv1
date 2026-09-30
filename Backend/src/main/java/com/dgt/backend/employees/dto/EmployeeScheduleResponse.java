package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.EmployeeSchedule;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EmployeeScheduleResponse(
        Long scheduleId,
        Long employeeId,
        String dgtId,
        LocalDate workDate,
        OffsetDateTime scheduleStart,
        OffsetDateTime scheduleEnd,
        String status,
        String notes,
        Long createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static EmployeeScheduleResponse from(EmployeeSchedule e) {
        return new EmployeeScheduleResponse(
                e.getScheduleId(), e.getEmployeeId(), e.getDgtId(),
                e.getWorkDate(), e.getScheduleStart(), e.getScheduleEnd(),
                e.getStatus(), e.getNotes(), e.getCreatedBy(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
