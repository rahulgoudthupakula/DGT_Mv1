package com.dgt.backend.inventory.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.inventory_transfer_items; IDs and types follow the inspected database. */
public record InventoryTransferItem(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("transfer_item_id") Long transferItemId,
        @JsonProperty("transfer_id") Long transferId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("qty_sent") BigDecimal qtySent,
        @JsonProperty("qty_received") BigDecimal qtyReceived,
        @JsonProperty("unit_cost") BigDecimal unitCost) {
    public static InventoryTransferItem fromRow(Map<String,Object> row) {
        return new InventoryTransferItem(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"transfer_item_id",Long.class),
            Rows.value(row,"transfer_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"qty_sent",BigDecimal.class),
            Rows.value(row,"qty_received",BigDecimal.class),
            Rows.value(row,"unit_cost",BigDecimal.class));
    }
}
