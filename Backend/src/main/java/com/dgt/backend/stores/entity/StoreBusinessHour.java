package com.dgt.backend.stores.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.store_business_hours; IDs and types follow the inspected database. */
public record StoreBusinessHour(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("business_hours_id") Long businessHoursId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("day_of_week") String dayOfWeek,
        @JsonProperty("open_time") LocalTime openTime,
        @JsonProperty("close_time") LocalTime closeTime,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("status") String status) {
    public static StoreBusinessHour fromRow(Map<String,Object> row) {
        return new StoreBusinessHour(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"business_hours_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"day_of_week",String.class),
            Rows.value(row,"open_time",LocalTime.class),
            Rows.value(row,"close_time",LocalTime.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"status",String.class));
    }
}
