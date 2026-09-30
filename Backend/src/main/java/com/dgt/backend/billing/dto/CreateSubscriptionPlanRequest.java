package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateSubscriptionPlanRequest(
        @NotBlank @Size(max = 100) String planName,
        @NotNull BigDecimal monthlyPrice
) {}
