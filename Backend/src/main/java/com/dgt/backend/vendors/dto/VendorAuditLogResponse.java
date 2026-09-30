package com.dgt.backend.vendors.dto;

import com.dgt.backend.vendors.entity.VendorAuditLog;
import java.time.OffsetDateTime;

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
    public static VendorAuditLogResponse from(VendorAuditLog e) {
        return new VendorAuditLogResponse(
                e.getAuditId(), e.getVendorId(), e.getProductId(),
                e.getDgtId(), e.getActionType(), e.getDetails(),
                e.getCostHistoryId(), e.getCreatedAt());
    }
}
