package com.dgt.backend.fuel.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Partial update payload for FuelTankReading.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateFuelTankReadingRequest(
        Long tankId,
        OffsetDateTime readingDatetime,
        BigDecimal volumeGallons,
        BigDecimal temperature,
        BigDecimal ullage,
        Long createdBy,
        String imageUrl
) {}
