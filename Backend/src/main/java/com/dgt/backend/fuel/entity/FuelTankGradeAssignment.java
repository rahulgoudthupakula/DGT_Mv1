package com.dgt.backend.fuel.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.fuel_tank_grade_assignments; IDs and types follow the inspected database. */
public record FuelTankGradeAssignment(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("assignment_id") Long assignmentId,
        @JsonProperty("tank_id") Long tankId,
        @JsonProperty("fuel_grade_id") Long fuelGradeId,
        @JsonProperty("effective_from") LocalDate effectiveFrom,
        @JsonProperty("effective_to") LocalDate effectiveTo,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static FuelTankGradeAssignment fromRow(Map<String,Object> row) {
        return new FuelTankGradeAssignment(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"assignment_id",Long.class),
            Rows.value(row,"tank_id",Long.class),
            Rows.value(row,"fuel_grade_id",Long.class),
            Rows.value(row,"effective_from",LocalDate.class),
            Rows.value(row,"effective_to",LocalDate.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
