package com.dgt.backend.identity.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.permissions; IDs and types follow the inspected database. */
public record Permission(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("permission_id") Long permissionId,
        @JsonProperty("module_id") Long moduleId,
        @JsonProperty("user_role_id") Long userRoleId,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("can_view") Boolean canView,
        @JsonProperty("can_edit") Boolean canEdit) {
    public static Permission fromRow(Map<String,Object> row) {
        return new Permission(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"permission_id",Long.class),
            Rows.value(row,"module_id",Long.class),
            Rows.value(row,"user_role_id",Long.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"can_view",Boolean.class),
            Rows.value(row,"can_edit",Boolean.class));
    }
}
