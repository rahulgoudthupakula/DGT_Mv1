package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record UpdateInventoryTransferRequest(
        @Size(max = 50) String fromDgtId,
        @Size(max = 50) String toDgtId,
        OffsetDateTime transferDate,
        @Size(max = 50) String status,
        Long createdBy
) {}
