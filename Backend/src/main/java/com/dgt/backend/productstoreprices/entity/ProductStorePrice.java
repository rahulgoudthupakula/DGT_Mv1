package com.dgt.backend.productstoreprices.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.product_store_prices; IDs and types follow the inspected database. */
public record ProductStorePrice(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("store_price_id") Long storePriceId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("retail_price") BigDecimal retailPrice,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("rebate_id") Long rebateId,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static ProductStorePrice fromRow(Map<String,Object> row) {
        return new ProductStorePrice(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"store_price_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"retail_price",BigDecimal.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"rebate_id",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
