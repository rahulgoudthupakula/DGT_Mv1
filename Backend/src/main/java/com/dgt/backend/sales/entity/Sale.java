package com.dgt.backend.sales.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.sales; IDs and types follow the inspected database. */
public record Sale(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("sale_id") Long saleId,
        @JsonProperty("store_id") String storeId,
        @JsonProperty("cashier_id") Long cashierId,
        @JsonProperty("terminal_id") Long terminalId,
        @JsonProperty("receipt_no") String receiptNo,
        @JsonProperty("transaction_id") String transactionId,
        @JsonProperty("transaction_type") String transactionType,
        @JsonProperty("sale_status") String saleStatus,
        @JsonProperty("sale_datetime") OffsetDateTime saleDatetime,
        @JsonProperty("subtotal") BigDecimal subtotal,
        @JsonProperty("taxable_amount") BigDecimal taxableAmount,
        @JsonProperty("tax_amount") BigDecimal taxAmount,
        @JsonProperty("discount_amount") BigDecimal discountAmount,
        @JsonProperty("total_amount") BigDecimal totalAmount,
        @JsonProperty("total_items") Integer totalItems,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static Sale fromRow(Map<String,Object> row) {
        return new Sale(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"sale_id",Long.class),
            Rows.value(row,"store_id",String.class),
            Rows.value(row,"cashier_id",Long.class),
            Rows.value(row,"terminal_id",Long.class),
            Rows.value(row,"receipt_no",String.class),
            Rows.value(row,"transaction_id",String.class),
            Rows.value(row,"transaction_type",String.class),
            Rows.value(row,"sale_status",String.class),
            Rows.value(row,"sale_datetime",OffsetDateTime.class),
            Rows.value(row,"subtotal",BigDecimal.class),
            Rows.value(row,"taxable_amount",BigDecimal.class),
            Rows.value(row,"tax_amount",BigDecimal.class),
            Rows.value(row,"discount_amount",BigDecimal.class),
            Rows.value(row,"total_amount",BigDecimal.class),
            Rows.value(row,"total_items",Integer.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
