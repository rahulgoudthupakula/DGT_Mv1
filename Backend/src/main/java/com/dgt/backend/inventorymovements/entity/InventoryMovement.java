package com.dgt.backend.inventorymovements.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.inventory_movements; IDs and types follow the inspected database. */
public record InventoryMovement(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("movement_id") Long movementId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("movement_type") String movementType,
        @JsonProperty("qty_changed") BigDecimal qtyChanged,
        @JsonProperty("unit_cost") BigDecimal unitCost,
        @JsonProperty("reference_id") Long referenceId,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static InventoryMovement fromRow(Map<String,Object> row) {
        return new InventoryMovement(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"movement_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"movement_type",String.class),
            Rows.value(row,"qty_changed",BigDecimal.class),
            Rows.value(row,"unit_cost",BigDecimal.class),
            Rows.value(row,"reference_id",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
