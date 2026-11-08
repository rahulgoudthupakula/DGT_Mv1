package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Partial update payload for FuelPrice.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateFuelPriceRequest(
        @Size(max = 50) String dgtId,
        Long fuelGradeId,
        BigDecimal cashPrice,
        BigDecimal creditPrice,
        OffsetDateTime effectiveFrom,
        OffsetDateTime effectiveTo,
        Long changedBy
) {}
