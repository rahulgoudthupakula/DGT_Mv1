package com.dgt.backend.inventory.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.inventory_return_items; IDs and types follow the inspected database. */
public record InventoryReturnItem(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("return_item_id") Long returnItemId,
        @JsonProperty("return_id") Long returnId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("qty") BigDecimal qty,
        @JsonProperty("unit_cost") BigDecimal unitCost,
        @JsonProperty("reason") String reason) {
    public static InventoryReturnItem fromRow(Map<String,Object> row) {
        return new InventoryReturnItem(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"return_item_id",Long.class),
            Rows.value(row,"return_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"qty",BigDecimal.class),
            Rows.value(row,"unit_cost",BigDecimal.class),
            Rows.value(row,"reason",String.class));
    }
}
