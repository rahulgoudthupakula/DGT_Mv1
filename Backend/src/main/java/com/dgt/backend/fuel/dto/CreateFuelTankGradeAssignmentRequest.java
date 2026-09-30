package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateFuelTankGradeAssignmentRequest(
        @NotNull Long tankId,
        @NotNull Long fuelGradeId,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo
) {}
