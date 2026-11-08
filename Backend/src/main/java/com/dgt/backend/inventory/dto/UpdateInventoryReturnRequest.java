package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial update payload for InventoryReturn.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateInventoryReturnRequest(
        @Size(max = 50) String dgtId,
        Long vendorId,
        @Size(max = 50) String returnType,
        @Size(max = 100) String referenceNumber,
        @Size(max = 50) String status
) {}
