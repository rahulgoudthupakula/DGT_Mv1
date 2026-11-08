package com.dgt.backend.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Request fields for creating a BillingInvoice record through the generic API.
 * Bean Validation annotations declare required fields and string-length limits.
 * Amounts are supplied by the caller; this DTO does not check their arithmetic.
 */

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
