package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.Size;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateVendorAuditLogRequest(
        Long vendorId,
        Long productId,
        @Size(max = 50) String dgtId,
        @Size(max = 50) String actionType,
        String details,
        Long costHistoryId
) {}
