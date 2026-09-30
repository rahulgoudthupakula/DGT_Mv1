package com.dgt.backend.inventory.dto;

import com.dgt.backend.inventory.entity.InventoryTransfer;
import java.time.OffsetDateTime;

public record InventoryTransferResponse(
        Long transferId,
        String fromDgtId,
        String toDgtId,
        OffsetDateTime transferDate,
        String status,
        Long createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static InventoryTransferResponse from(InventoryTransfer e) {
        return new InventoryTransferResponse(
                e.getTransferId(), e.getFromDgtId(), e.getToDgtId(),
                e.getTransferDate(), e.getStatus(), e.getCreatedBy(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
