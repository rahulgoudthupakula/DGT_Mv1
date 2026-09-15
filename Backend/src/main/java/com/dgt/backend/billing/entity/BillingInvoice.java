package com.dgt.backend.billing.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.billing_invoices; IDs and types follow the inspected database. */
public record BillingInvoice(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("store_id") String storeId,
        @JsonProperty("subscription_plan_id") Long subscriptionPlanId,
        @JsonProperty("invoice_number") String invoiceNumber,
        @JsonProperty("invoice_date") LocalDate invoiceDate,
        @JsonProperty("period_start") LocalDate periodStart,
        @JsonProperty("period_end") LocalDate periodEnd,
        @JsonProperty("subtotal") BigDecimal subtotal,
        @JsonProperty("tax_amount") BigDecimal taxAmount,
        @JsonProperty("total_amount") BigDecimal totalAmount,
        @JsonProperty("dgt_invoice_status") String dgtInvoiceStatus,
        @JsonProperty("paid_at") OffsetDateTime paidAt,
        @JsonProperty("invoice_document_url") String invoiceDocumentUrl,
        @JsonProperty("created_at") OffsetDateTime createdAt) {
    public static BillingInvoice fromRow(Map<String,Object> row) {
        return new BillingInvoice(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"store_id",String.class),
            Rows.value(row,"subscription_plan_id",Long.class),
            Rows.value(row,"invoice_number",String.class),
            Rows.value(row,"invoice_date",LocalDate.class),
            Rows.value(row,"period_start",LocalDate.class),
            Rows.value(row,"period_end",LocalDate.class),
            Rows.value(row,"subtotal",BigDecimal.class),
            Rows.value(row,"tax_amount",BigDecimal.class),
            Rows.value(row,"total_amount",BigDecimal.class),
            Rows.value(row,"dgt_invoice_status",String.class),
            Rows.value(row,"paid_at",OffsetDateTime.class),
            Rows.value(row,"invoice_document_url",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class));
    }
}
