package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Creation payload for FuelTank.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateFuelTankRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @NotBlank @Size(max = 20) String tankNumber,
        @Size(max = 100) String tankName,
        BigDecimal capacityGallons,
        BigDecimal safeFillCapacity
) {}
