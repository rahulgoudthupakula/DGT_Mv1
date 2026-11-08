package com.dgt.backend.lottery.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Partial update payload for LotterySetting.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateLotterySettingRequest(
        @Size(max = 50) String dgtId,
        Integer maxOpenPacksPerGame,
        Boolean allowPartialReturns,
        BigDecimal defaultCommissionPerPack,
        JsonNode settlementFrequency
) {}
