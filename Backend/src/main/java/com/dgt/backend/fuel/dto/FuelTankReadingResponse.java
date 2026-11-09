package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelTankReading;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored FuelTankReading fields.
 */

public record FuelTankReadingResponse(
        Long tankReadingId,
        Long tankId,
        OffsetDateTime readingDatetime,
        BigDecimal volumeGallons,
        BigDecimal temperature,
        BigDecimal ullage,
        Long createdBy,
        String imageUrl,
        OffsetDateTime createdAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static FuelTankReadingResponse from(FuelTankReading e) {
        return new FuelTankReadingResponse(
                e.getTankReadingId(), e.getTankId(), e.getReadingDatetime(),
                e.getVolumeGallons(), e.getTemperature(), e.getUllage(),
                e.getCreatedBy(), e.getImageUrl(), e.getCreatedAt());
    }
}
