package com.dgt.backend.billing.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.store_subscriptions; IDs and types follow the inspected database. */
public record StoreSubscription(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("subscription_id") Long subscriptionId,
        @JsonProperty("store_id") String storeId,
        @JsonProperty("subscription_plan_id") Long subscriptionPlanId,
        @JsonProperty("subscription_status") String subscriptionStatus,
        @JsonProperty("start_date") LocalDate startDate,
        @JsonProperty("current_period_start") LocalDate currentPeriodStart,
        @JsonProperty("current_period_end") LocalDate currentPeriodEnd,
        @JsonProperty("next_billing_date") LocalDate nextBillingDate,
        @JsonProperty("auto_renewal") Boolean autoRenewal,
        @JsonProperty("cancelled_at") OffsetDateTime cancelledAt,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static StoreSubscription fromRow(Map<String,Object> row) {
        return new StoreSubscription(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"subscription_id",Long.class),
            Rows.value(row,"store_id",String.class),
            Rows.value(row,"subscription_plan_id",Long.class),
            Rows.value(row,"subscription_status",String.class),
            Rows.value(row,"start_date",LocalDate.class),
            Rows.value(row,"current_period_start",LocalDate.class),
            Rows.value(row,"current_period_end",LocalDate.class),
            Rows.value(row,"next_billing_date",LocalDate.class),
            Rows.value(row,"auto_renewal",Boolean.class),
            Rows.value(row,"cancelled_at",OffsetDateTime.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
