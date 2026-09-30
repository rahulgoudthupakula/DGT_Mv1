package com.dgt.backend.stores.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalTime;

public record UpdateStoreBusinessHourRequest(
        @Size(max = 50) String dgtId,
        @Size(max = 20) String dayOfWeek,
        LocalTime openTime,
        LocalTime closeTime,
        @Size(max = 20) String status
) {}
