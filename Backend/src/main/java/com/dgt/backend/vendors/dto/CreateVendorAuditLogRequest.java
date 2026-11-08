package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Creation payload for the generic vendor audit record API; declared constraints run when validated by the controller.
public record CreateVendorAuditLogRequest(
        @NotNull Long vendorId,
        Long productId,
        @Size(max = 50) String dgtId,
        @Size(max = 50) String actionType,
        String details,
        Long costHistoryId
) {}
