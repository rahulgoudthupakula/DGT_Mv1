package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Creation payload for FuelTankGradeAssignment.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateFuelTankGradeAssignmentRequest(
        @NotNull Long tankId,
        @NotNull Long fuelGradeId,
        @NotNull LocalDate effectiveFrom,
        LocalDate effectiveTo
) {}
