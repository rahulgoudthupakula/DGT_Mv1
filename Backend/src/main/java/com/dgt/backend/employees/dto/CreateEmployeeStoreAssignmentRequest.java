package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateEmployeeStoreAssignmentRequest(
        @NotNull Long employeeId,
        @NotBlank @Size(max = 50) String dgtId,
        Boolean isPrimary,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo,
        Long roleTypeId
) {}
