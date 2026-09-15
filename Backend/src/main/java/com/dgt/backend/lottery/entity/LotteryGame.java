package com.dgt.backend.lottery.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.lottery_games; IDs and types follow the inspected database. */
public record LotteryGame(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("lottery_game_id") Long lotteryGameId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("game_code") String gameCode,
        @JsonProperty("game_name") String gameName,
        @JsonProperty("ticket_price") BigDecimal ticketPrice,
        @JsonProperty("tickets_per_pack") Integer ticketsPerPack,
        @JsonProperty("pack_value") BigDecimal packValue,
        @JsonProperty("commission_percent") BigDecimal commissionPercent,
        @JsonProperty("status") String status,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("pack_number") String packNumber,
        @JsonProperty("barcode") String barcode) {
    public static LotteryGame fromRow(Map<String,Object> row) {
        return new LotteryGame(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"lottery_game_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"game_code",String.class),
            Rows.value(row,"game_name",String.class),
            Rows.value(row,"ticket_price",BigDecimal.class),
            Rows.value(row,"tickets_per_pack",Integer.class),
            Rows.value(row,"pack_value",BigDecimal.class),
            Rows.value(row,"commission_percent",BigDecimal.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"pack_number",String.class),
            Rows.value(row,"barcode",String.class));
    }
}
