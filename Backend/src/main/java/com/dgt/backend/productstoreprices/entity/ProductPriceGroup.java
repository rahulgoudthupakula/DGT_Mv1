package com.dgt.backend.productstoreprices.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.product_price_groups; IDs and types follow the inspected database. */
public record ProductPriceGroup(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("product_price_group_id") Long productPriceGroupId,
        @JsonProperty("price_group_id") Long priceGroupId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static ProductPriceGroup fromRow(Map<String,Object> row) {
        return new ProductPriceGroup(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"product_price_group_id",Long.class),
            Rows.value(row,"price_group_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
