package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateSubscriptionPlanRequest(
        @Size(max = 100) String planName,
        BigDecimal monthlyPrice
) {}
