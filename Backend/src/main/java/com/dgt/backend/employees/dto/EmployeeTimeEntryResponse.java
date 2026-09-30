package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.EmployeeTimeEntry;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record EmployeeTimeEntryResponse(
        Long timeEntryId,
        Long employeeId,
        String dgtId,
        OffsetDateTime clockIn,
        OffsetDateTime clockOut,
        BigDecimal regularHours,
        BigDecimal overtimeHours,
        String eventType,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static EmployeeTimeEntryResponse from(EmployeeTimeEntry e) {
        return new EmployeeTimeEntryResponse(
                e.getTimeEntryId(), e.getEmployeeId(), e.getDgtId(),
                e.getClockIn(), e.getClockOut(), e.getRegularHours(),
                e.getOvertimeHours(), e.getEventType(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
