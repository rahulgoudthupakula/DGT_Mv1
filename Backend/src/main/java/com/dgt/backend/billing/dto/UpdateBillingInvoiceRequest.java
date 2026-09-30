package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record UpdateBillingInvoiceRequest(
        @Size(max = 50) String storeId,
        Long subscriptionPlanId,
        @Size(max = 100) String invoiceNumber,
        LocalDate invoiceDate,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        @Size(max = 50) String dgtInvoiceStatus,
        OffsetDateTime paidAt,
        String invoiceDocumentUrl
) {}
