package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateBillingInvoiceRequest(
        @NotBlank @Size(max = 50) String storeId,
        @NotNull Long subscriptionPlanId,
        @Size(max = 100) String invoiceNumber,
        @NotNull LocalDate invoiceDate,
        @NotNull LocalDate periodStart,
        @NotNull LocalDate periodEnd,
        @NotNull BigDecimal subtotal,
        @NotNull BigDecimal taxAmount,
        @NotNull BigDecimal totalAmount,
        @NotBlank @Size(max = 50) String dgtInvoiceStatus,
        OffsetDateTime paidAt,
        String invoiceDocumentUrl
) {}
