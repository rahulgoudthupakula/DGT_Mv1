package com.dgt.backend.sales.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record UpdateSaleRequest(
        @Size(max = 50) String storeId,
        Long cashierId,
        Long terminalId,
        @Size(max = 100) String receiptNo,
        @Size(max = 100) String transactionId,
        @Size(max = 50) String transactionType,
        @Size(max = 50) String saleStatus,
        OffsetDateTime saleDatetime,
        BigDecimal subtotal,
        BigDecimal taxableAmount,
        BigDecimal taxAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        Integer totalItems
) {}
