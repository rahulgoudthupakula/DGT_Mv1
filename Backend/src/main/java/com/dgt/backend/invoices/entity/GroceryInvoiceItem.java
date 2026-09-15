package com.dgt.backend.invoices.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.grocery_invoice_items; IDs and types follow the inspected database. */
public record GroceryInvoiceItem(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("grocery_invoice_item_id") Long groceryInvoiceItemId,
        @JsonProperty("invoice_id") Long invoiceId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("vendor_item_code") String vendorItemCode,
        @JsonProperty("quantity") BigDecimal quantity,
        @JsonProperty("unit_type") String unitType,
        @JsonProperty("case_pack_quantity") BigDecimal casePackQuantity,
        @JsonProperty("msrp") BigDecimal msrp,
        @JsonProperty("unit_cost") BigDecimal unitCost,
        @JsonProperty("item_line_discount") BigDecimal itemLineDiscount,
        @JsonProperty("item_line_total") BigDecimal itemLineTotal,
        @JsonProperty("is_product_new") Boolean isProductNew,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static GroceryInvoiceItem fromRow(Map<String,Object> row) {
        return new GroceryInvoiceItem(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"grocery_invoice_item_id",Long.class),
            Rows.value(row,"invoice_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"vendor_item_code",String.class),
            Rows.value(row,"quantity",BigDecimal.class),
            Rows.value(row,"unit_type",String.class),
            Rows.value(row,"case_pack_quantity",BigDecimal.class),
            Rows.value(row,"msrp",BigDecimal.class),
            Rows.value(row,"unit_cost",BigDecimal.class),
            Rows.value(row,"item_line_discount",BigDecimal.class),
            Rows.value(row,"item_line_total",BigDecimal.class),
            Rows.value(row,"is_product_new",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
