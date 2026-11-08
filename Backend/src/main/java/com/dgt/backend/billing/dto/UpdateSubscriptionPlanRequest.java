package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Partial update fields for a SubscriptionPlan record.
 * The service treats null as unchanged, so this request cannot clear nullable fields.
 */

public record UpdateSubscriptionPlanRequest(
        @Size(max = 100) String planName,
        BigDecimal monthlyPrice
) {}
