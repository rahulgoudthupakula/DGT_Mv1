package com.dgt.backend.sales.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.sale_payments; IDs and types follow the inspected database. */
public record SalePayment(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("sale_payment_id") Long salePaymentId,
        @JsonProperty("sale_id") Long saleId,
        @JsonProperty("tender_type_id") Long tenderTypeId,
        @JsonProperty("payment_amount") BigDecimal paymentAmount,
        @JsonProperty("payment_status") String paymentStatus,
        @JsonProperty("card_brand") String cardBrand,
        @JsonProperty("card_last4") String cardLast4,
        @JsonProperty("processor_reference") String processorReference,
        @JsonProperty("authorization_code") String authorizationCode,
        @JsonProperty("payment_datetime") OffsetDateTime paymentDatetime,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static SalePayment fromRow(Map<String,Object> row) {
        return new SalePayment(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"sale_payment_id",Long.class),
            Rows.value(row,"sale_id",Long.class),
            Rows.value(row,"tender_type_id",Long.class),
            Rows.value(row,"payment_amount",BigDecimal.class),
            Rows.value(row,"payment_status",String.class),
            Rows.value(row,"card_brand",String.class),
            Rows.value(row,"card_last4",String.class),
            Rows.value(row,"processor_reference",String.class),
            Rows.value(row,"authorization_code",String.class),
            Rows.value(row,"payment_datetime",OffsetDateTime.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
