package com.dgt.backend.vendors.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.vendors; IDs and types follow the inspected database. */
public record Vendor(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("vendor_id") Long vendorId,
        @JsonProperty("vendor_name") String vendorName,
        @JsonProperty("email") String email,
        @JsonProperty("phone_number") String phoneNumber,
        @JsonProperty("website_url") String websiteUrl,
        @JsonProperty("payment_terms") String paymentTerms,
        @JsonProperty("lead_time_days") Integer leadTimeDays,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static Vendor fromRow(Map<String,Object> row) {
        return new Vendor(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"vendor_id",Long.class),
            Rows.value(row,"vendor_name",String.class),
            Rows.value(row,"email",String.class),
            Rows.value(row,"phone_number",String.class),
            Rows.value(row,"website_url",String.class),
            Rows.value(row,"payment_terms",String.class),
            Rows.value(row,"lead_time_days",Integer.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
