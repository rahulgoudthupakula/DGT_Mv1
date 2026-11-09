package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Partial update payload for FuelTank.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateFuelTankRequest(
        @Size(max = 50) String dgtId,
        @Size(max = 20) String tankNumber,
        @Size(max = 100) String tankName,
        BigDecimal capacityGallons,
        BigDecimal safeFillCapacity
) {}
