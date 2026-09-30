package com.dgt.backend.lottery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record CreateLotteryPackInventoryRequest(
        @NotBlank @Size(max = 50) String dgtId,
        Long shiftOpenedBy,
        OffsetDateTime shiftOpenedAt,
        OffsetDateTime shiftClosedAt
) {}
