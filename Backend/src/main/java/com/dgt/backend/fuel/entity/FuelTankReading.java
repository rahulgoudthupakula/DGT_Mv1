package com.dgt.backend.fuel.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.fuel_tank_readings; IDs and types follow the inspected database. */
public record FuelTankReading(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("tank_reading_id") Long tankReadingId,
        @JsonProperty("tank_id") Long tankId,
        @JsonProperty("reading_datetime") OffsetDateTime readingDatetime,
        @JsonProperty("volume_gallons") BigDecimal volumeGallons,
        @JsonProperty("temperature") BigDecimal temperature,
        @JsonProperty("ullage") BigDecimal ullage,
        @JsonProperty("created_by") Long createdBy,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("image_url") String imageUrl) {
    public static FuelTankReading fromRow(Map<String,Object> row) {
        return new FuelTankReading(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"tank_reading_id",Long.class),
            Rows.value(row,"tank_id",Long.class),
            Rows.value(row,"reading_datetime",OffsetDateTime.class),
            Rows.value(row,"volume_gallons",BigDecimal.class),
            Rows.value(row,"temperature",BigDecimal.class),
            Rows.value(row,"ullage",BigDecimal.class),
            Rows.value(row,"created_by",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"image_url",String.class));
    }
}
