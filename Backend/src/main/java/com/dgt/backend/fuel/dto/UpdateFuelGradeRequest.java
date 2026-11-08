package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Partial update payload for FuelGrade.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateFuelGradeRequest(
        @Size(max = 50) String fuelType,
        @Size(max = 100) String gradeName,
        BigDecimal octaneRating,
        Boolean isActive
) {}
