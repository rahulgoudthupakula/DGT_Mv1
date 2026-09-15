package com.dgt.backend.billing.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.subscription_plans; IDs and types follow the inspected database. */
public record SubscriptionPlan(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("subscription_plan_id") Long subscriptionPlanId,
        @JsonProperty("plan_name") String planName,
        @JsonProperty("monthly_price") BigDecimal monthlyPrice,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static SubscriptionPlan fromRow(Map<String,Object> row) {
        return new SubscriptionPlan(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"subscription_plan_id",Long.class),
            Rows.value(row,"plan_name",String.class),
            Rows.value(row,"monthly_price",BigDecimal.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
