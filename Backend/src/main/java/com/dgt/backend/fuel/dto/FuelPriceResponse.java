package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelPrice;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored FuelPrice fields.
 */

public record FuelPriceResponse(
        Long fuelPriceId,
        String dgtId,
        Long fuelGradeId,
        BigDecimal cashPrice,
        BigDecimal creditPrice,
        OffsetDateTime effectiveFrom,
        OffsetDateTime effectiveTo,
        Long changedBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static FuelPriceResponse from(FuelPrice e) {
        return new FuelPriceResponse(
                e.getFuelPriceId(), e.getDgtId(), e.getFuelGradeId(),
                e.getCashPrice(), e.getCreditPrice(), e.getEffectiveFrom(),
                e.getEffectiveTo(), e.getChangedBy(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
