package com.dgt.backend.products.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.products; IDs and types follow the inspected database. */
public record Product(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("store_sub_department_id") Long storeSubDepartmentId,
        @JsonProperty("product_name") String productName,
        @JsonProperty("product_sku") String productSku,
        @JsonProperty("is_returnable") Boolean isReturnable,
        @JsonProperty("brand_id") Long brandId,
        @JsonProperty("unit_of_measure") String unitOfMeasure,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("is_taxable") Boolean isTaxable,
        @JsonProperty("is_ebt") Boolean isEbt) {
    public static Product fromRow(Map<String,Object> row) {
        return new Product(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"store_sub_department_id",Long.class),
            Rows.value(row,"product_name",String.class),
            Rows.value(row,"product_sku",String.class),
            Rows.value(row,"is_returnable",Boolean.class),
            Rows.value(row,"brand_id",Long.class),
            Rows.value(row,"unit_of_measure",String.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"is_taxable",Boolean.class),
            Rows.value(row,"is_ebt",Boolean.class));
    }
}
