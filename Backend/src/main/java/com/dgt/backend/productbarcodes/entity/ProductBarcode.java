package com.dgt.backend.productbarcodes.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.product_barcodes; IDs and types follow the inspected database. */
public record ProductBarcode(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("product_barcode_id") Long productBarcodeId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("product_barcode_type") String productBarcodeType,
        @JsonProperty("product_barcode_value") String productBarcodeValue,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static ProductBarcode fromRow(Map<String,Object> row) {
        return new ProductBarcode(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"product_barcode_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"product_barcode_type",String.class),
            Rows.value(row,"product_barcode_value",String.class),
            Rows.value(row,"is_primary",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
