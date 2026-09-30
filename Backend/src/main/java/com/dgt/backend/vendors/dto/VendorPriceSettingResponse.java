package com.dgt.backend.vendors.dto;

import com.dgt.backend.vendors.entity.VendorPriceSetting;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record VendorPriceSettingResponse(
        Long settingId,
        String dgtId,
        Boolean priceChangeAlertEnabled,
        BigDecimal alertThresholdPercentage,
        Boolean approvalRequired,
        Long permissionId,
        BigDecimal approvalThresholdPercentage,
        Boolean autoPickPreferredVendor,
        Boolean useFallbackVendor,
        Boolean considerLeadTime,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static VendorPriceSettingResponse from(VendorPriceSetting e) {
        return new VendorPriceSettingResponse(
                e.getSettingId(), e.getDgtId(), e.getPriceChangeAlertEnabled(),
                e.getAlertThresholdPercentage(), e.getApprovalRequired(),
                e.getPermissionId(), e.getApprovalThresholdPercentage(),
                e.getAutoPickPreferredVendor(), e.getUseFallbackVendor(),
                e.getConsiderLeadTime(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
