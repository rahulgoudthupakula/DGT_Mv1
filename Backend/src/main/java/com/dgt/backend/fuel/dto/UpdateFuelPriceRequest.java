package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record UpdateFuelPriceRequest(
        @Size(max = 50) String dgtId,
        Long fuelGradeId,
        BigDecimal cashPrice,
        BigDecimal creditPrice,
        OffsetDateTime effectiveFrom,
        OffsetDateTime effectiveTo,
        Long changedBy
) {}
