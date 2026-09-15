package com.dgt.backend.inventory.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.inventory_returns; IDs and types follow the inspected database. */
public record InventoryReturn(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("return_id") Long returnId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("vendor_id") Long vendorId,
        @JsonProperty("return_type") String returnType,
        @JsonProperty("reference_number") String referenceNumber,
        @JsonProperty("status") String status,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static InventoryReturn fromRow(Map<String,Object> row) {
        return new InventoryReturn(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"return_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"vendor_id",Long.class),
            Rows.value(row,"return_type",String.class),
            Rows.value(row,"reference_number",String.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
