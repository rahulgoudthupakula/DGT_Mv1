package com.dgt.backend.inventory.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.inventory; IDs and types follow the inspected database. */
public record Inventory(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("inventory_id") Long inventoryId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("available_quantity") BigDecimal availableQuantity,
        @JsonProperty("cost") BigDecimal cost,
        @JsonProperty("return_cost") BigDecimal returnCost,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static Inventory fromRow(Map<String,Object> row) {
        return new Inventory(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"inventory_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"available_quantity",BigDecimal.class),
            Rows.value(row,"cost",BigDecimal.class),
            Rows.value(row,"return_cost",BigDecimal.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
