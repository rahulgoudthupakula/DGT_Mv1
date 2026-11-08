package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Partial update fields for a StoreSubscription record.
 * The service treats null as unchanged, so this request cannot clear nullable fields.
 */

public record UpdateStoreSubscriptionRequest(
        @Size(max = 50) String storeId,
        Long subscriptionPlanId,
        @Size(max = 50) String subscriptionStatus,
        LocalDate startDate,
        LocalDate currentPeriodStart,
        LocalDate currentPeriodEnd,
        LocalDate nextBillingDate,
        Boolean autoRenewal,
        OffsetDateTime cancelledAt
) {}
