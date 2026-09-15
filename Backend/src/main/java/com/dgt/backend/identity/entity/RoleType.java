package com.dgt.backend.identity.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.role_types; IDs and types follow the inspected database. */
public record RoleType(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("role_type_id") Long roleTypeId,
        @JsonProperty("role_type_name") String roleTypeName,
        @JsonProperty("description") String description,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static RoleType fromRow(Map<String,Object> row) {
        return new RoleType(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"role_type_id",Long.class),
            Rows.value(row,"role_type_name",String.class),
            Rows.value(row,"description",String.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
