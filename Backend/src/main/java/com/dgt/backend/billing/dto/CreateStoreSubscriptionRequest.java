package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateStoreSubscriptionRequest(
        @NotBlank @Size(max = 50) String storeId,
        @NotNull Long subscriptionPlanId,
        @NotBlank @Size(max = 50) String subscriptionStatus,
        @NotNull LocalDate startDate,
        LocalDate currentPeriodStart,
        LocalDate currentPeriodEnd,
        LocalDate nextBillingDate,
        Boolean autoRenewal,
        OffsetDateTime cancelledAt
) {}
