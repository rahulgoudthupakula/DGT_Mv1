package com.dgt.backend.sales.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.pos_terminals; IDs and types follow the inspected database. */
public record PosTerminal(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("terminal_id") Long terminalId,
        @JsonProperty("store_id") String storeId,
        @JsonProperty("terminal_code") String terminalCode,
        @JsonProperty("terminal_name") String terminalName,
        @JsonProperty("terminal_status") String terminalStatus,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static PosTerminal fromRow(Map<String,Object> row) {
        return new PosTerminal(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"terminal_id",Long.class),
            Rows.value(row,"store_id",String.class),
            Rows.value(row,"terminal_code",String.class),
            Rows.value(row,"terminal_name",String.class),
            Rows.value(row,"terminal_status",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
