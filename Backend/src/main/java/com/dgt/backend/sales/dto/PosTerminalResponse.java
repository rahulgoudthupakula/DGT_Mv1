package com.dgt.backend.sales.dto;

import com.dgt.backend.sales.entity.PosTerminal;
import java.time.OffsetDateTime;

// Response projection for the POS terminal record, including database identity and lifecycle timestamps.
public record PosTerminalResponse(
        Long terminalId,
        String storeId,
        String terminalCode,
        String terminalName,
        String terminalStatus,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static PosTerminalResponse from(PosTerminal e) {
        return new PosTerminalResponse(
                e.getTerminalId(), e.getStoreId(), e.getTerminalCode(),
                e.getTerminalName(), e.getTerminalStatus(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
