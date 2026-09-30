package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record CreateFuelTankReadingRequest(
        @NotNull Long tankId,
        @NotNull OffsetDateTime readingDatetime,
        @NotNull BigDecimal volumeGallons,
        BigDecimal temperature,
        BigDecimal ullage,
        Long createdBy,
        String imageUrl
) {}
