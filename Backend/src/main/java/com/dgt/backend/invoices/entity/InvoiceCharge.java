package com.dgt.backend.invoices.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.invoice_charges; IDs and types follow the inspected database. */
public record InvoiceCharge(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("invoice_charge_id") Long invoiceChargeId,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("charge_type") String chargeType,
        @JsonProperty("sub_total") BigDecimal subTotal,
        @JsonProperty("discounted_amount") BigDecimal discountedAmount,
        @JsonProperty("other_charges") BigDecimal otherCharges,
        @JsonProperty("total_amount") BigDecimal totalAmount,
        @JsonProperty("status_id") Long statusId,
        @JsonProperty("payment_status") String paymentStatus,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static InvoiceCharge fromRow(Map<String,Object> row) {
        return new InvoiceCharge(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"invoice_charge_id",Long.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"charge_type",String.class),
            Rows.value(row,"sub_total",BigDecimal.class),
            Rows.value(row,"discounted_amount",BigDecimal.class),
            Rows.value(row,"other_charges",BigDecimal.class),
            Rows.value(row,"total_amount",BigDecimal.class),
            Rows.value(row,"status_id",Long.class),
            Rows.value(row,"payment_status",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
