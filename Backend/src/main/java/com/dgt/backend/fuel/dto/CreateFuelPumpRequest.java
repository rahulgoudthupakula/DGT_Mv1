package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Creation payload for FuelPump.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateFuelPumpRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @NotBlank @Size(max = 20) String pumpNumber,
        @NotBlank @Size(max = 50) String status,
        @Size(max = 100) String serialNumber
) {}
