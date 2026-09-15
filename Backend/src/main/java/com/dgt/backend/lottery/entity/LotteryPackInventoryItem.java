package com.dgt.backend.lottery.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.lottery_pack_inventory_items; IDs and types follow the inspected database. */
public record LotteryPackInventoryItem(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("lottery_pack_inventory_item_id") Long lotteryPackInventoryItemId,
        @JsonProperty("lottery_pack_inventory_id") Long lotteryPackInventoryId,
        @JsonProperty("open_ticket_number") Integer openTicketNumber,
        @JsonProperty("last_sold_ticket_number") Integer lastSoldTicketNumber,
        @JsonProperty("physical_quantity") Integer physicalQuantity,
        @JsonProperty("pack_id") Long packId,
        @JsonProperty("commission_amount") BigDecimal commissionAmount,
        @JsonProperty("expected_cash") BigDecimal expectedCash,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static LotteryPackInventoryItem fromRow(Map<String,Object> row) {
        return new LotteryPackInventoryItem(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"lottery_pack_inventory_item_id",Long.class),
            Rows.value(row,"lottery_pack_inventory_id",Long.class),
            Rows.value(row,"open_ticket_number",Integer.class),
            Rows.value(row,"last_sold_ticket_number",Integer.class),
            Rows.value(row,"physical_quantity",Integer.class),
            Rows.value(row,"pack_id",Long.class),
            Rows.value(row,"commission_amount",BigDecimal.class),
            Rows.value(row,"expected_cash",BigDecimal.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
