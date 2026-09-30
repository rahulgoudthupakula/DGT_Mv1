package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelTankGradeAssignment;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record FuelTankGradeAssignmentResponse(
        Long assignmentId,
        Long tankId,
        Long fuelGradeId,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static FuelTankGradeAssignmentResponse from(FuelTankGradeAssignment e) {
        return new FuelTankGradeAssignmentResponse(
                e.getAssignmentId(), e.getTankId(), e.getFuelGradeId(),
                e.getEffectiveFrom(), e.getEffectiveTo(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
