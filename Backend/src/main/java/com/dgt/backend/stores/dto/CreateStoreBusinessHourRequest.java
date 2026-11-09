package com.dgt.backend.stores.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;

// Creation payload for the generic store business hours API; declared constraints run when validated by the controller.
public record CreateStoreBusinessHourRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @Size(max = 20) String dayOfWeek,
        LocalTime openTime,
        LocalTime closeTime,
        @Size(max = 20) String status
) {}
