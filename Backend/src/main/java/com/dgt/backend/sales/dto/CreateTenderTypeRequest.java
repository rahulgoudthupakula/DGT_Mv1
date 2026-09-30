package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTenderTypeRequest(
        @NotBlank @Size(max = 50) String tenderCode,
        @NotBlank @Size(max = 100) String tenderName,
        Boolean isActive
) {}
