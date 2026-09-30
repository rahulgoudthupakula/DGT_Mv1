package com.dgt.backend.billing.dto;

import com.dgt.backend.billing.entity.SubscriptionPlan;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SubscriptionPlanResponse(
        Long subscriptionPlanId,
        String planName,
        BigDecimal monthlyPrice,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static SubscriptionPlanResponse from(SubscriptionPlan e) {
        return new SubscriptionPlanResponse(
                e.getSubscriptionPlanId(), e.getPlanName(), e.getMonthlyPrice(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
