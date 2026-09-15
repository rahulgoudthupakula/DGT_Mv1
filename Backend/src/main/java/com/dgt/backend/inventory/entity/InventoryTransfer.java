package com.dgt.backend.inventory.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.inventory_transfers; IDs and types follow the inspected database. */
public record InventoryTransfer(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("transfer_id") Long transferId,
        @JsonProperty("from_dgt_id") String fromDgtId,
        @JsonProperty("to_dgt_id") String toDgtId,
        @JsonProperty("transfer_date") OffsetDateTime transferDate,
        @JsonProperty("status") String status,
        @JsonProperty("created_by") Long createdBy,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static InventoryTransfer fromRow(Map<String,Object> row) {
        return new InventoryTransfer(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"transfer_id",Long.class),
            Rows.value(row,"from_dgt_id",String.class),
            Rows.value(row,"to_dgt_id",String.class),
            Rows.value(row,"transfer_date",OffsetDateTime.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"created_by",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
