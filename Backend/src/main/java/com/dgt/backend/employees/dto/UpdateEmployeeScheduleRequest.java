package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record UpdateEmployeeScheduleRequest(
        Long employeeId,
        @Size(max = 50) String dgtId,
        LocalDate workDate,
        OffsetDateTime scheduleStart,
        OffsetDateTime scheduleEnd,
        @Size(max = 50) String status,
        String notes,
        Long createdBy
) {}
