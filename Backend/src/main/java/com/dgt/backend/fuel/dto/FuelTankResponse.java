package com.dgt.backend.fuel.dto;

import com.dgt.backend.fuel.entity.FuelTank;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record FuelTankResponse(
        Long tankId,
        String dgtId,
        String tankNumber,
        String tankName,
        BigDecimal capacityGallons,
        BigDecimal safeFillCapacity,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static FuelTankResponse from(FuelTank e) {
        return new FuelTankResponse(
                e.getTankId(), e.getDgtId(), e.getTankNumber(),
                e.getTankName(), e.getCapacityGallons(), e.getSafeFillCapacity(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
