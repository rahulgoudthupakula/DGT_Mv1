package com.dgt.backend.inventory.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.inventory_shrinkage_items; IDs and types follow the inspected database. */
public record InventoryShrinkageItem(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("shrinkage_item_id") Long shrinkageItemId,
        @JsonProperty("shrinkage_id") Long shrinkageId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("qty") BigDecimal qty,
        @JsonProperty("unit_cost") BigDecimal unitCost,
        @JsonProperty("loss_amount") BigDecimal lossAmount,
        @JsonProperty("reason") String reason) {
    public static InventoryShrinkageItem fromRow(Map<String,Object> row) {
        return new InventoryShrinkageItem(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"shrinkage_item_id",Long.class),
            Rows.value(row,"shrinkage_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"qty",BigDecimal.class),
            Rows.value(row,"unit_cost",BigDecimal.class),
            Rows.value(row,"loss_amount",BigDecimal.class),
            Rows.value(row,"reason",String.class));
    }
}
