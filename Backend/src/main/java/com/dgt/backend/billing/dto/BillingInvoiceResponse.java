package com.dgt.backend.billing.dto;

import com.dgt.backend.billing.entity.BillingInvoice;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Response snapshot of a BillingInvoice entity for the generic API.
 * Contains stored values rather than computed billing-page summaries.
 */

public record BillingInvoiceResponse(
        Long invoiceId,
        String storeId,
        Long subscriptionPlanId,
        String invoiceNumber,
        LocalDate invoiceDate,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String dgtInvoiceStatus,
        OffsetDateTime paidAt,
        String invoiceDocumentUrl,
        OffsetDateTime createdAt
) {
    /** Copy persisted entity fields into the API response without recalculating amounts. */
    public static BillingInvoiceResponse from(BillingInvoice e) {
        return new BillingInvoiceResponse(
                e.getInvoiceId(), e.getStoreId(), e.getSubscriptionPlanId(),
                e.getInvoiceNumber(), e.getInvoiceDate(), e.getPeriodStart(),
                e.getPeriodEnd(), e.getSubtotal(), e.getTaxAmount(),
                e.getTotalAmount(), e.getDgtInvoiceStatus(), e.getPaidAt(),
                e.getInvoiceDocumentUrl(), e.getCreatedAt());
    }
}
