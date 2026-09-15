package com.dgt.backend.invoices.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.invoices; IDs and types follow the inspected database. */
public record Invoice(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("vendor_id") Long vendorId,
        @JsonProperty("invoice_number") String invoiceNumber,
        @JsonProperty("invoice_type") String invoiceType,
        @JsonProperty("invoice_date") LocalDate invoiceDate,
        @JsonProperty("received_date") LocalDate receivedDate,
        @JsonProperty("due_date") LocalDate dueDate,
        @JsonProperty("received_by") Long receivedBy,
        @JsonProperty("approved_by") Long approvedBy,
        @JsonProperty("approved_at") OffsetDateTime approvedAt,
        @JsonProperty("purchase_order_id") Long purchaseOrderId) {
    public static Invoice fromRow(Map<String,Object> row) {
        return new Invoice(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"vendor_id",Long.class),
            Rows.value(row,"invoice_number",String.class),
            Rows.value(row,"invoice_type",String.class),
            Rows.value(row,"invoice_date",LocalDate.class),
            Rows.value(row,"received_date",LocalDate.class),
            Rows.value(row,"due_date",LocalDate.class),
            Rows.value(row,"received_by",Long.class),
            Rows.value(row,"approved_by",Long.class),
            Rows.value(row,"approved_at",OffsetDateTime.class),
            Rows.value(row,"purchase_order_id",Long.class));
    }
}
