package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.InventoryReductionRequest;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored InventoryReductionRequest fields.
 */

public record InventoryReductionRequestResponse(
        Long reductionRequestId,
        String dgtId,
        Long productId,
        String requestType,
        BigDecimal quantity,
        String reason,
        String status,
        String notes,
        String destination,
        Long requestedBy,
        String rejectionReason,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static InventoryReductionRequestResponse from(InventoryReductionRequest e) {
        return new InventoryReductionRequestResponse(
                e.getReductionRequestId(), e.getDgtId(), e.getProductId(),
                e.getRequestType(), e.getQuantity(), e.getReason(),
                e.getStatus(), e.getNotes(), e.getDestination(),
                e.getRequestedBy(), e.getRejectionReason(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
