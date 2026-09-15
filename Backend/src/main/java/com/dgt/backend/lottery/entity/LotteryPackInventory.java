package com.dgt.backend.lottery.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.lottery_pack_inventory; IDs and types follow the inspected database. */
public record LotteryPackInventory(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("lottery_pack_inventory_id") Long lotteryPackInventoryId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("shift_opened_by") Long shiftOpenedBy,
        @JsonProperty("shift_opened_at") OffsetDateTime shiftOpenedAt,
        @JsonProperty("shift_closed_at") OffsetDateTime shiftClosedAt,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static LotteryPackInventory fromRow(Map<String,Object> row) {
        return new LotteryPackInventory(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"lottery_pack_inventory_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"shift_opened_by",Long.class),
            Rows.value(row,"shift_opened_at",OffsetDateTime.class),
            Rows.value(row,"shift_closed_at",OffsetDateTime.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
