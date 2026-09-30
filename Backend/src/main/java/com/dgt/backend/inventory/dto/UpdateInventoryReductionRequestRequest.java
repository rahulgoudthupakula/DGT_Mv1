package com.dgt.backend.inventory.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateInventoryReductionRequestRequest(
        @Size(max = 50) String dgtId,
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
