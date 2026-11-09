package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/**
 * Partial update payload for InventoryTransfer.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateInventoryTransferRequest(
        @Size(max = 50) String fromDgtId,
        @Size(max = 50) String toDgtId,
        OffsetDateTime transferDate,
        @Size(max = 50) String status,
        Long createdBy
) {}
