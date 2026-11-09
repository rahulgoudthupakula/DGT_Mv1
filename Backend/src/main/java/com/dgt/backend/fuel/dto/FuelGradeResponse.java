package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelGrade;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored FuelGrade fields.
 */

public record FuelGradeResponse(
        Long fuelGradeId,
        String fuelType,
        String gradeName,
        BigDecimal octaneRating,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static FuelGradeResponse from(FuelGrade e) {
        return new FuelGradeResponse(
                e.getFuelGradeId(), e.getFuelType(), e.getGradeName(),
                e.getOctaneRating(), e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
