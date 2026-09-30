package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record UpdateSalePaymentRequest(
        Long saleId,
        Long tenderTypeId,
        BigDecimal paymentAmount,
        @Size(max = 50) String paymentStatus,
        @Size(max = 50) String cardBrand,
        @Size(max = 10) String cardLast4,
        @Size(max = 100) String processorReference,
        @Size(max = 100) String authorizationCode,
        OffsetDateTime paymentDatetime
) {}
