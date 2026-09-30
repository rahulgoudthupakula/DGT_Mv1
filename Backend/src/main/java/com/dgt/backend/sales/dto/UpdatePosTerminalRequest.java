package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.Size;

public record UpdatePosTerminalRequest(
        @Size(max = 50) String storeId,
        @Size(max = 50) String terminalCode,
        @Size(max = 100) String terminalName,
        @Size(max = 50) String terminalStatus
) {}
