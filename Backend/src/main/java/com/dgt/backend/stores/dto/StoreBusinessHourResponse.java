package com.dgt.backend.stores.dto;

import com.dgt.backend.stores.entity.StoreBusinessHour;
import java.time.LocalTime;
import java.time.OffsetDateTime;

// Response projection for the store business hours record, including database identity and lifecycle timestamps.
public record StoreBusinessHourResponse(
        Long businessHoursId,
        String dgtId,
        String dayOfWeek,
        LocalTime openTime,
        LocalTime closeTime,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static StoreBusinessHourResponse from(StoreBusinessHour e) {
        return new StoreBusinessHourResponse(
                e.getBusinessHoursId(), e.getDgtId(), e.getDayOfWeek(),
                e.getOpenTime(), e.getCloseTime(), e.getStatus(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
