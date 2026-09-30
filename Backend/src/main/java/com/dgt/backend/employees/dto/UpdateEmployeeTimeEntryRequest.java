package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record UpdateEmployeeTimeEntryRequest(
        Long employeeId,
        @Size(max = 50) String dgtId,
        OffsetDateTime clockIn,
        OffsetDateTime clockOut,
        BigDecimal regularHours,
        BigDecimal overtimeHours,
        @Size(max = 50) String eventType
) {}
