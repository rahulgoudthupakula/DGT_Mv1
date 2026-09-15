package com.dgt.backend.sales.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.sales_items; IDs and types follow the inspected database. */
public record SaleItem(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("sales_item_id") Long salesItemId,
        @JsonProperty("sale_id") Long saleId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("quantity") BigDecimal quantity,
        @JsonProperty("catalog_price") BigDecimal catalogPrice,
        @JsonProperty("unit_price") BigDecimal unitPrice,
        @JsonProperty("gross_amount") BigDecimal grossAmount,
        @JsonProperty("discount_amount") BigDecimal discountAmount,
        @JsonProperty("taxable_amount") BigDecimal taxableAmount,
        @JsonProperty("tax_amount") BigDecimal taxAmount,
        @JsonProperty("line_total") BigDecimal lineTotal,
        @JsonProperty("created_at") OffsetDateTime createdAt) {
    public static SaleItem fromRow(Map<String,Object> row) {
        return new SaleItem(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"sales_item_id",Long.class),
            Rows.value(row,"sale_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"quantity",BigDecimal.class),
            Rows.value(row,"catalog_price",BigDecimal.class),
            Rows.value(row,"unit_price",BigDecimal.class),
            Rows.value(row,"gross_amount",BigDecimal.class),
            Rows.value(row,"discount_amount",BigDecimal.class),
            Rows.value(row,"taxable_amount",BigDecimal.class),
            Rows.value(row,"tax_amount",BigDecimal.class),
            Rows.value(row,"line_total",BigDecimal.class),
            Rows.value(row,"created_at",OffsetDateTime.class));
    }
}
