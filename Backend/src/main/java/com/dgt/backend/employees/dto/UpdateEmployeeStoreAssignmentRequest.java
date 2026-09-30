package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateEmployeeStoreAssignmentRequest(
        Long employeeId,
        @Size(max = 50) String dgtId,
        Boolean isPrimary,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        Long roleTypeId
) {}
