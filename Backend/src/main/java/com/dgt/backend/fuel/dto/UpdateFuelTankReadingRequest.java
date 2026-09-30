package com.dgt.backend.fuel.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record UpdateFuelTankReadingRequest(
        Long tankId,
        OffsetDateTime readingDatetime,
        BigDecimal volumeGallons,
        BigDecimal temperature,
        BigDecimal ullage,
        Long createdBy,
        String imageUrl
) {}
