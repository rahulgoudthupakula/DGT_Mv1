package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/**
 * Partial update payload for InventoryShrinkage.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateInventoryShrinkageRequest(
        @Size(max = 50) String dgtId,
        OffsetDateTime shrinkageDate,
        @Size(max = 100) String reasonType,
        Long createdBy
) {}
