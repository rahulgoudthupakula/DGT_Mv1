package com.dgt.backend.lottery.dto;

import com.dgt.backend.lottery.entity.LotterySetting;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record LotterySettingResponse(
        Long lotterySettingId,
        String dgtId,
        Integer maxOpenPacksPerGame,
        Boolean allowPartialReturns,
        BigDecimal defaultCommissionPerPack,
        JsonNode settlementFrequency,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static LotterySettingResponse from(LotterySetting e) {
        return new LotterySettingResponse(
                e.getLotterySettingId(), e.getDgtId(), e.getMaxOpenPacksPerGame(),
                e.getAllowPartialReturns(), e.getDefaultCommissionPerPack(),
                e.getSettlementFrequency(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
