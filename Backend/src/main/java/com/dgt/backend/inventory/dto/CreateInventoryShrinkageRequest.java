package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/**
 * Creation payload for InventoryShrinkage.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateInventoryShrinkageRequest(
        @NotBlank @Size(max = 50) String dgtId,
        OffsetDateTime shrinkageDate,
        @Size(max = 100) String reasonType,
        Long createdBy
) {}
