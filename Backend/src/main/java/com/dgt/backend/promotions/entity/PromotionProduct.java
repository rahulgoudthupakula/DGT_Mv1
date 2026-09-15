package com.dgt.backend.promotions.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.promotion_products; IDs and types follow the inspected database. */
public record PromotionProduct(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("promotion_product_id") Long promotionProductId,
        @JsonProperty("promotion_id") Long promotionId,
        @JsonProperty("product_id") Long productId,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static PromotionProduct fromRow(Map<String,Object> row) {
        return new PromotionProduct(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"promotion_product_id",Long.class),
            Rows.value(row,"promotion_id",Long.class),
            Rows.value(row,"product_id",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
