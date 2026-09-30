package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelTankReading;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

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
    public static FuelTankReadingResponse from(FuelTankReading e) {
        return new FuelTankReadingResponse(
                e.getTankReadingId(), e.getTankId(), e.getReadingDatetime(),
                e.getVolumeGallons(), e.getTemperature(), e.getUllage(),
                e.getCreatedBy(), e.getImageUrl(), e.getCreatedAt());
    }
}
