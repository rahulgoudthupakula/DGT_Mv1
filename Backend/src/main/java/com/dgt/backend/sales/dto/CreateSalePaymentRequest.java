package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record CreateSalePaymentRequest(
        @NotNull Long saleId,
        Long tenderTypeId,
        @NotNull BigDecimal paymentAmount,
        @Size(max = 50) String paymentStatus,
        @Size(max = 50) String cardBrand,
        @Size(max = 10) String cardLast4,
        @Size(max = 100) String processorReference,
        @Size(max = 100) String authorizationCode,
        OffsetDateTime paymentDatetime
) {}
