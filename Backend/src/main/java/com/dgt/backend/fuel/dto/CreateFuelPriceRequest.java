package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record CreateFuelPriceRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @NotNull Long fuelGradeId,
        @NotNull BigDecimal cashPrice,
        @NotNull BigDecimal creditPrice,
        @NotNull OffsetDateTime effectiveFrom,
        OffsetDateTime effectiveTo,
        Long changedBy
) {}
