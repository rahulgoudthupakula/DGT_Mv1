package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateFuelGradeRequest(
        @Size(max = 50) String fuelType,
        @Size(max = 100) String gradeName,
        BigDecimal octaneRating,
        Boolean isActive
) {}
