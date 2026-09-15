package com.dgt.backend.sales.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.tender_types; IDs and types follow the inspected database. */
public record TenderType(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("tender_type_id") Long tenderTypeId,
        @JsonProperty("tender_code") String tenderCode,
        @JsonProperty("tender_name") String tenderName,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static TenderType fromRow(Map<String,Object> row) {
        return new TenderType(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"tender_type_id",Long.class),
            Rows.value(row,"tender_code",String.class),
            Rows.value(row,"tender_name",String.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
