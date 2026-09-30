package com.dgt.backend.lottery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateLotteryGameRequest(
        @NotBlank @Size(max = 50) String dgtId,
        @Size(max = 50) String gameCode,
        @Size(max = 100) String gameName,
        BigDecimal ticketPrice,
        Integer ticketsPerPack,
        BigDecimal packValue,
        BigDecimal commissionPercent,
        @Size(max = 50) String status,
        @Size(max = 100) String packNumber,
        @Size(max = 100) String barcode
) {}
