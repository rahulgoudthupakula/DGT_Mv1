package com.dgt.backend.invoices.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.invoice_adjustments; IDs and types follow the inspected database. */
public record InvoiceAdjustment(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("invoice_adjustment_id") Long invoiceAdjustmentId,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("adjustment_type") String adjustmentType,
        @JsonProperty("adjusted_amount") BigDecimal adjustedAmount,
        @JsonProperty("reason") String reason,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static InvoiceAdjustment fromRow(Map<String,Object> row) {
        return new InvoiceAdjustment(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"invoice_adjustment_id",Long.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"adjustment_type",String.class),
            Rows.value(row,"adjusted_amount",BigDecimal.class),
            Rows.value(row,"reason",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
