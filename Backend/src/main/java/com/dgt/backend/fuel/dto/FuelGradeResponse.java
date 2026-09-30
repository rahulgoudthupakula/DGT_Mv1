package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelGrade;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record FuelGradeResponse(
        Long fuelGradeId,
        String fuelType,
        String gradeName,
        BigDecimal octaneRating,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static FuelGradeResponse from(FuelGrade e) {
        return new FuelGradeResponse(
                e.getFuelGradeId(), e.getFuelType(), e.getGradeName(),
                e.getOctaneRating(), e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
