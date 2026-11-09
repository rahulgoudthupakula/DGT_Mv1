package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.Size;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateTenderTypeRequest(
        @Size(max = 50) String tenderCode,
        @Size(max = 100) String tenderName,
        Boolean isActive
) {}
