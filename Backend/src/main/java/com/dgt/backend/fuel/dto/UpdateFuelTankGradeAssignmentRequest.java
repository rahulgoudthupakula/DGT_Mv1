package com.dgt.backend.fuel.dto;

import java.time.LocalDate;

/**
 * Partial update payload for FuelTankGradeAssignment.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateFuelTankGradeAssignmentRequest(
        Long tankId,
        Long fuelGradeId,
        LocalDate effectiveFrom,
        LocalDate effectiveTo
) {}
