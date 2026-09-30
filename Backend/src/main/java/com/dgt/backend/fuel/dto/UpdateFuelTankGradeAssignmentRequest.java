package com.dgt.backend.fuel.dto;

import java.time.LocalDate;

public record UpdateFuelTankGradeAssignmentRequest(
        Long tankId,
        Long fuelGradeId,
        LocalDate effectiveFrom,
        LocalDate effectiveTo
) {}
