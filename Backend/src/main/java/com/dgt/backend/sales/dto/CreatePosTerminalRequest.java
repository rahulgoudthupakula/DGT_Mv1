package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePosTerminalRequest(
        @NotBlank @Size(max = 50) String storeId,
        @NotBlank @Size(max = 50) String terminalCode,
        @NotBlank @Size(max = 100) String terminalName,
        @NotBlank @Size(max = 50) String terminalStatus
) {}
