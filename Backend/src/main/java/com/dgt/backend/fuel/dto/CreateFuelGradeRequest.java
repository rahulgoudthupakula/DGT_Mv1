package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Creation payload for FuelGrade.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateFuelGradeRequest(
        @NotBlank @Size(max = 50) String fuelType,
        @NotBlank @Size(max = 100) String gradeName,
        BigDecimal octaneRating,
        Boolean isActive
) {}
