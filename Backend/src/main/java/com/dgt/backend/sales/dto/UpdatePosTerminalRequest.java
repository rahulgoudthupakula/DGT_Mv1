package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.Size;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdatePosTerminalRequest(
        @Size(max = 50) String storeId,
        @Size(max = 50) String terminalCode,
        @Size(max = 100) String terminalName,
        @Size(max = 50) String terminalStatus
) {}
