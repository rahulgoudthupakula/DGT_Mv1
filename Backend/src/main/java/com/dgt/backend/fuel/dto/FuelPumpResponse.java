package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelPump;
import java.time.OffsetDateTime;

public record FuelPumpResponse(
        Long pumpId,
        String dgtId,
        String pumpNumber,
        String status,
        String serialNumber,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static FuelPumpResponse from(FuelPump e) {
        return new FuelPumpResponse(
                e.getPumpId(), e.getDgtId(), e.getPumpNumber(),
                e.getStatus(), e.getSerialNumber(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
