package com.dgt.backend.fuel.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.fuel_tanks; IDs and types follow the inspected database. */
public record FuelTank(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("tank_id") Long tankId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("tank_number") String tankNumber,
        @JsonProperty("tank_name") String tankName,
        @JsonProperty("capacity_gallons") BigDecimal capacityGallons,
        @JsonProperty("safe_fill_capacity") BigDecimal safeFillCapacity,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static FuelTank fromRow(Map<String,Object> row) {
        return new FuelTank(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"tank_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"tank_number",String.class),
            Rows.value(row,"tank_name",String.class),
            Rows.value(row,"capacity_gallons",BigDecimal.class),
            Rows.value(row,"safe_fill_capacity",BigDecimal.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
