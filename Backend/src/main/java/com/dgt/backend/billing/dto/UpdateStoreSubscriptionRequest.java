package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

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
