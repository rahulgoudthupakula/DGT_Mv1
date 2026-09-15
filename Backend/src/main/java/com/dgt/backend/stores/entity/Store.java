package com.dgt.backend.stores.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.stores; IDs and types follow the inspected database. */
public record Store(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("store_id") String storeId,
        @JsonProperty("store_name") String storeName,
        @JsonProperty("legal_business_name") String legalBusinessName,
        @JsonProperty("tax_id") String taxId,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("license_number") String licenseNumber,
        @JsonProperty("timezone") String timezone,
        @JsonProperty("company_id") Long companyId) {
    public static Store fromRow(Map<String,Object> row) {
        return new Store(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"store_id",String.class),
            Rows.value(row,"store_name",String.class),
            Rows.value(row,"legal_business_name",String.class),
            Rows.value(row,"tax_id",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"license_number",String.class),
            Rows.value(row,"timezone",String.class),
            Rows.value(row,"company_id",Long.class));
    }
}
