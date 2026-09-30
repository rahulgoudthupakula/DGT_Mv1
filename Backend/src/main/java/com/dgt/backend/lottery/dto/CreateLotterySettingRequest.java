package com.dgt.backend.lottery.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateLotterySettingRequest(
        @NotBlank @Size(max = 50) String dgtId,
        Integer maxOpenPacksPerGame,
        Boolean allowPartialReturns,
        BigDecimal defaultCommissionPerPack,
        JsonNode settlementFrequency
) {}
