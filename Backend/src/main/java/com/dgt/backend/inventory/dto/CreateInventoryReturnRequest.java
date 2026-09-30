package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateInventoryReturnRequest(
        @NotBlank @Size(max = 50) String dgtId,
        Long vendorId,
        @Size(max = 50) String returnType,
        @Size(max = 100) String referenceNumber,
        @Size(max = 50) String status
) {}
