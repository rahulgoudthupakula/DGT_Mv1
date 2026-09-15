package com.dgt.backend.identity.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.user_roles; IDs and types follow the inspected database. */
public record UserRole(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("user_role_id") Long userRoleId,
        @JsonProperty("user_id") Long userId,
        @JsonProperty("role_type_id") Long roleTypeId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static UserRole fromRow(Map<String,Object> row) {
        return new UserRole(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"user_role_id",Long.class),
            Rows.value(row,"user_id",Long.class),
            Rows.value(row,"role_type_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
