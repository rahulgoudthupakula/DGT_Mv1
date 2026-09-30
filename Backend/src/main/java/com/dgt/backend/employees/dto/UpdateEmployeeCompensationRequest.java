package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateEmployeeCompensationRequest(
        Long employeeId,
        @Size(max = 50) String payType,
        BigDecimal hourlyRate,
        BigDecimal annualSalary,
        LocalDate effectiveFrom,
        LocalDate effectiveTo
) {}
