package com.dgt.backend.fuel.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.fuel_prices; IDs and types follow the inspected database. */
public record FuelPrice(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("fuel_price_id") Long fuelPriceId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("fuel_grade_id") Long fuelGradeId,
        @JsonProperty("cash_price") BigDecimal cashPrice,
        @JsonProperty("credit_price") BigDecimal creditPrice,
        @JsonProperty("effective_from") OffsetDateTime effectiveFrom,
        @JsonProperty("effective_to") OffsetDateTime effectiveTo,
        @JsonProperty("changed_by") Long changedBy,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static FuelPrice fromRow(Map<String,Object> row) {
        return new FuelPrice(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"fuel_price_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"fuel_grade_id",Long.class),
            Rows.value(row,"cash_price",BigDecimal.class),
            Rows.value(row,"credit_price",BigDecimal.class),
            Rows.value(row,"effective_from",OffsetDateTime.class),
            Rows.value(row,"effective_to",OffsetDateTime.class),
            Rows.value(row,"changed_by",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
