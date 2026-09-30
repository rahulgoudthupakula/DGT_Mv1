package com.dgt.backend.sales.dto;

import com.dgt.backend.sales.entity.PosTerminal;
import java.time.OffsetDateTime;

public record PosTerminalResponse(
        Long terminalId,
        String storeId,
        String terminalCode,
        String terminalName,
        String terminalStatus,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static PosTerminalResponse from(PosTerminal e) {
        return new PosTerminalResponse(
                e.getTerminalId(), e.getStoreId(), e.getTerminalCode(),
                e.getTerminalName(), e.getTerminalStatus(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
