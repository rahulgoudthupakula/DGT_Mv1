package com.dgt.backend.vendors.dto;

import com.dgt.backend.vendors.entity.VendorAuditLog;
import java.time.OffsetDateTime;

// Response projection for the vendor audit record record, including database identity and lifecycle timestamps.
public record VendorAuditLogResponse(
        Long auditId,
        Long vendorId,
        Long productId,
        String dgtId,
        String actionType,
        String details,
        Long costHistoryId,
        OffsetDateTime createdAt
) {
    // Copy entity fields into the response without exposing the persistence object itself.
    public static VendorAuditLogResponse from(VendorAuditLog e) {
        return new VendorAuditLogResponse(
                e.getAuditId(), e.getVendorId(), e.getProductId(),
                e.getDgtId(), e.getActionType(), e.getDetails(),
                e.getCostHistoryId(), e.getCreatedAt());
    }
}
