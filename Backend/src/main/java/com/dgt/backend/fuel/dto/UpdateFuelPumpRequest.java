package com.dgt.backend.fuel.dto;

import jakarta.validation.constraints.Size;

public record UpdateFuelPumpRequest(
        @Size(max = 50) String dgtId,
        @Size(max = 20) String pumpNumber,
        @Size(max = 50) String status,
        @Size(max = 100) String serialNumber
) {}
