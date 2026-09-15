package com.dgt.backend.fuel.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.fuel_grades; IDs and types follow the inspected database. */
public record FuelGrade(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("fuel_grade_id") Long fuelGradeId,
        @JsonProperty("fuel_type") String fuelType,
        @JsonProperty("grade_name") String gradeName,
        @JsonProperty("octane_rating") BigDecimal octaneRating,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static FuelGrade fromRow(Map<String,Object> row) {
        return new FuelGrade(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"fuel_grade_id",Long.class),
            Rows.value(row,"fuel_type",String.class),
            Rows.value(row,"grade_name",String.class),
            Rows.value(row,"octane_rating",BigDecimal.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
