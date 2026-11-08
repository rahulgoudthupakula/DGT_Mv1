package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

// Partial-update payload: service code treats null fields as unchanged, including boxed Boolean flags.
public record UpdateVendorPriceSettingRequest(
        @Size(max = 50) String dgtId,
        Boolean priceChangeAlertEnabled,
        BigDecimal alertThresholdPercentage,
        Boolean approvalRequired,
        Long permissionId,
        BigDecimal approvalThresholdPercentage,
        Boolean autoPickPreferredVendor,
        Boolean useFallbackVendor,
        Boolean considerLeadTime
) {}
