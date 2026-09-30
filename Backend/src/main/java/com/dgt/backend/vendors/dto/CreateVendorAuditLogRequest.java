package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateVendorAuditLogRequest(
        @NotNull Long vendorId,
        Long productId,
        @Size(max = 50) String dgtId,
        @Size(max = 50) String actionType,
        String details,
        Long costHistoryId
) {}
