package com.dgt.backend.vendors.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

// Creation payload for the generic vendor pricing preferences API; declared constraints run when validated by the controller.
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
