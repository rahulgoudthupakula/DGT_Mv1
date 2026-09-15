package com.dgt.backend.stores.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.store_contact_info; IDs and types follow the inspected database. */
public record StoreContactInfo(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("contact_info_id") Long contactInfoId,
        @JsonProperty("phone_number") String phoneNumber,
        @JsonProperty("email") String email,
        @JsonProperty("address") String address,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("store_name") String storeName) {
    public static StoreContactInfo fromRow(Map<String,Object> row) {
        return new StoreContactInfo(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"contact_info_id",Long.class),
            Rows.value(row,"phone_number",String.class),
            Rows.value(row,"email",String.class),
            Rows.value(row,"address",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"store_name",String.class));
    }
}
