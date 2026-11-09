package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Request fields for creating a SubscriptionPlan record through the generic API.
 * Bean Validation annotations declare required fields and string-length limits.
 */

public record CreateSubscriptionPlanRequest(
        @NotBlank @Size(max = 100) String planName,
        @NotNull BigDecimal monthlyPrice
) {}
