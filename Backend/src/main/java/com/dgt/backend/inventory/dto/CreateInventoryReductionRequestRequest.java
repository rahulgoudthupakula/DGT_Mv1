package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Creation payload for InventoryReductionRequest.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateInventoryReductionRequestRequest(
        @NotBlank @Size(max = 50) String dgtId,
        Long productId,
        @Size(max = 50) String requestType,
        BigDecimal quantity,
        String reason,
        @Size(max = 50) String status,
        String notes,
        @Size(max = 100) String destination,
        Long requestedBy,
        String rejectionReason
) {}
