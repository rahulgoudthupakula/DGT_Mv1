package com.dgt.backend.lottery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/**
 * Creation payload for LotteryPackInventory.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateLotteryPackInventoryRequest(
        @NotBlank @Size(max = 50) String dgtId,
        Long shiftOpenedBy,
        OffsetDateTime shiftOpenedAt,
        OffsetDateTime shiftClosedAt
) {}
