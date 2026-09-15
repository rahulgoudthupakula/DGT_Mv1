package com.dgt.backend.products.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.brands; IDs and types follow the inspected database. */
public record Brand(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("brand_id") Long brandId,
        @JsonProperty("brand_name") String brandName,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("description") String description) {
    public static Brand fromRow(Map<String,Object> row) {
        return new Brand(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"brand_id",Long.class),
            Rows.value(row,"brand_name",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"description",String.class));
    }
}
