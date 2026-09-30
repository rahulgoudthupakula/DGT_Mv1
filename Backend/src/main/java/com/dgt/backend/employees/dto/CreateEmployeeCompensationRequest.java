package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateEmployeeCompensationRequest(
        @NotNull Long employeeId,
        @NotBlank @Size(max = 50) String payType,
        BigDecimal hourlyRate,
        BigDecimal annualSalary,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo
) {}
