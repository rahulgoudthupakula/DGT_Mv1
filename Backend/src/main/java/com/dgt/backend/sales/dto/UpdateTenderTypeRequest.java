package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.Size;

public record UpdateTenderTypeRequest(
        @Size(max = 50) String tenderCode,
        @Size(max = 100) String tenderName,
        Boolean isActive
) {}
