package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.InventoryReturn;
import java.time.OffsetDateTime;

public record InventoryReturnResponse(
        Long returnId,
        String dgtId,
        Long vendorId,
        String returnType,
        String referenceNumber,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static InventoryReturnResponse from(InventoryReturn e) {
        return new InventoryReturnResponse(
                e.getReturnId(), e.getDgtId(), e.getVendorId(),
                e.getReturnType(), e.getReferenceNumber(), e.getStatus(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
