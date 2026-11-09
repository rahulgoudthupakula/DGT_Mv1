package com.dgt.backend.lottery.dto;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/**
 * Partial update payload for LotteryPackInventory.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateLotteryPackInventoryRequest(
        @Size(max = 50) String dgtId,
        Long shiftOpenedBy,
        OffsetDateTime shiftOpenedAt,
        OffsetDateTime shiftClosedAt
) {}
