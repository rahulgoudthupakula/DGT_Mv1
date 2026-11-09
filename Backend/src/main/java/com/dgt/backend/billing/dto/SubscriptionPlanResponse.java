package com.dgt.backend.billing.dto;

import com.dgt.backend.billing.entity.SubscriptionPlan;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Response snapshot of a SubscriptionPlan entity for the generic API.
 * Contains stored values rather than computed billing-page summaries.
 */

public record SubscriptionPlanResponse(
        Long subscriptionPlanId,
        String planName,
        BigDecimal monthlyPrice,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy persisted entity fields into the API response without recalculating amounts. */
    public static SubscriptionPlanResponse from(SubscriptionPlan e) {
        return new SubscriptionPlanResponse(
                e.getSubscriptionPlanId(), e.getPlanName(), e.getMonthlyPrice(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
