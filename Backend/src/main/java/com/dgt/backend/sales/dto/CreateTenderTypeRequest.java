package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Creation payload for the generic tender type API; declared constraints run when validated by the controller.
public record CreateTenderTypeRequest(
        @NotBlank @Size(max = 50) String tenderCode,
        @NotBlank @Size(max = 100) String tenderName,
        Boolean isActive
) {}
