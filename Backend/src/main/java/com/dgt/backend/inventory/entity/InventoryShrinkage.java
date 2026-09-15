package com.dgt.backend.inventory.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.inventory_shrinkage; IDs and types follow the inspected database. */
public record InventoryShrinkage(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("shrinkage_id") Long shrinkageId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("shrinkage_date") OffsetDateTime shrinkageDate,
        @JsonProperty("reason_type") String reasonType,
        @JsonProperty("created_by") Long createdBy,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static InventoryShrinkage fromRow(Map<String,Object> row) {
        return new InventoryShrinkage(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"shrinkage_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"shrinkage_date",OffsetDateTime.class),
            Rows.value(row,"reason_type",String.class),
            Rows.value(row,"created_by",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
