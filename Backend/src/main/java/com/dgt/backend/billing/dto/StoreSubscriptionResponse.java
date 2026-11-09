package com.dgt.backend.billing.dto;

import com.dgt.backend.billing.entity.StoreSubscription;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Response snapshot of a StoreSubscription entity for the generic API.
 * Contains stored values rather than computed billing-page summaries.
 */

public record StoreSubscriptionResponse(
        Long subscriptionId,
        String storeId,
        Long subscriptionPlanId,
        String subscriptionStatus,
        LocalDate startDate,
        LocalDate currentPeriodStart,
        LocalDate currentPeriodEnd,
        LocalDate nextBillingDate,
        Boolean autoRenewal,
        OffsetDateTime cancelledAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy persisted entity fields into the API response without recalculating amounts. */
    public static StoreSubscriptionResponse from(StoreSubscription e) {
        return new StoreSubscriptionResponse(
                e.getSubscriptionId(), e.getStoreId(), e.getSubscriptionPlanId(),
                e.getSubscriptionStatus(), e.getStartDate(), e.getCurrentPeriodStart(),
                e.getCurrentPeriodEnd(), e.getNextBillingDate(), e.getAutoRenewal(),
                e.getCancelledAt(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
