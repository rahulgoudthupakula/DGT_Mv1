package com.dgt.backend.productstoreprices.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.price_groups; IDs and types follow the inspected database. */
public record PriceGroup(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("price_group_id") Long priceGroupId,
        @JsonProperty("price_group_name") String priceGroupName,
        @JsonProperty("description") String description,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("group_price") BigDecimal groupPrice,
        @JsonProperty("dgt_id") String dgtId) {
    public static PriceGroup fromRow(Map<String,Object> row) {
        return new PriceGroup(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"price_group_id",Long.class),
            Rows.value(row,"price_group_name",String.class),
            Rows.value(row,"description",String.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"group_price",BigDecimal.class),
            Rows.value(row,"dgt_id",String.class));
    }
}
