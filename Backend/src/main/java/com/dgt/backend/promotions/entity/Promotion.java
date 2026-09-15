package com.dgt.backend.promotions.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.promotions; IDs and types follow the inspected database. */
public record Promotion(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("promotion_id") Long promotionId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("promotion_name") String promotionName,
        @JsonProperty("promotion_type") String promotionType,
        @JsonProperty("start_date") OffsetDateTime startDate,
        @JsonProperty("end_date") OffsetDateTime endDate,
        @JsonProperty("status") String status,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("discount_value") BigDecimal discountValue) {
    public static Promotion fromRow(Map<String,Object> row) {
        return new Promotion(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"promotion_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"promotion_name",String.class),
            Rows.value(row,"promotion_type",String.class),
            Rows.value(row,"start_date",OffsetDateTime.class),
            Rows.value(row,"end_date",OffsetDateTime.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"discount_value",BigDecimal.class));
    }
}
