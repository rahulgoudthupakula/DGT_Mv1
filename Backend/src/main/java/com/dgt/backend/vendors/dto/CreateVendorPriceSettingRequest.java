package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateVendorPriceSettingRequest(
        @NotBlank @Size(max = 50) String dgtId,
        Boolean priceChangeAlertEnabled,
        BigDecimal alertThresholdPercentage,
        Boolean approvalRequired,
        Long permissionId,
        BigDecimal approvalThresholdPercentage,
        Boolean autoPickPreferredVendor,
        Boolean useFallbackVendor,
        Boolean considerLeadTime
) {}
