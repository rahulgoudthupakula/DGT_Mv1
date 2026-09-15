package com.dgt.backend.productvendors.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.product_vendors; IDs and types follow the inspected database. */
public record ProductVendor(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("product_vendor_id") Long productVendorId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("vendor_id") Long vendorId,
        @JsonProperty("vendor_sku") String vendorSku,
        @JsonProperty("unit_type") String unitType,
        @JsonProperty("unit_of_measure") String unitOfMeasure,
        @JsonProperty("unit_cost") BigDecimal unitCost,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static ProductVendor fromRow(Map<String,Object> row) {
        return new ProductVendor(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"product_vendor_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"vendor_id",Long.class),
            Rows.value(row,"vendor_sku",String.class),
            Rows.value(row,"unit_type",String.class),
            Rows.value(row,"unit_of_measure",String.class),
            Rows.value(row,"unit_cost",BigDecimal.class),
            Rows.value(row,"is_primary",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
