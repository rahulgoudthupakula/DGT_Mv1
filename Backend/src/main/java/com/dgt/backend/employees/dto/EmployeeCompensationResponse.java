package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.EmployeeCompensation;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EmployeeCompensationResponse(
        Long compensationId,
        Long employeeId,
        String payType,
        BigDecimal hourlyRate,
        BigDecimal annualSalary,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static EmployeeCompensationResponse from(EmployeeCompensation e) {
        return new EmployeeCompensationResponse(
                e.getCompensationId(), e.getEmployeeId(), e.getPayType(),
                e.getHourlyRate(), e.getAnnualSalary(), e.getEffectiveFrom(),
                e.getEffectiveTo(), e.getArchivedAt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
