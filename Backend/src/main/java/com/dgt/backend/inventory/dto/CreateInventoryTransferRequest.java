package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record CreateInventoryTransferRequest(
        @NotBlank @Size(max = 50) String fromDgtId,
        @NotBlank @Size(max = 50) String toDgtId,
        OffsetDateTime transferDate,
        @Size(max = 50) String status,
        Long createdBy
) {}
