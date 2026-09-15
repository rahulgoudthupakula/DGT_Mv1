package com.dgt.backend.fuel.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.fuel_pumps; IDs and types follow the inspected database. */
public record FuelPump(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("pump_id") Long pumpId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("pump_number") String pumpNumber,
        @JsonProperty("status") String status,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("serial_number") String serialNumber) {
    public static FuelPump fromRow(Map<String,Object> row) {
        return new FuelPump(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"pump_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"pump_number",String.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"serial_number",String.class));
    }
}
