package com.dgt.backend.lottery.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.lottery_settings; IDs and types follow the inspected database. */
public record LotterySetting(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("lottery_setting_id") Long lotterySettingId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("max_open_packs_per_game") Integer maxOpenPacksPerGame,
        @JsonProperty("allow_partial_returns") Boolean allowPartialReturns,
        @JsonProperty("default_commission_per_pack") BigDecimal defaultCommissionPerPack,
        @JsonProperty("settlement_frequency") JsonNode settlementFrequency,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static LotterySetting fromRow(Map<String,Object> row) {
        return new LotterySetting(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"lottery_setting_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"max_open_packs_per_game",Integer.class),
            Rows.value(row,"allow_partial_returns",Boolean.class),
            Rows.value(row,"default_commission_per_pack",BigDecimal.class),
            Rows.value(row,"settlement_frequency",JsonNode.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
