package com.dgt.backend.identity.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.modules; IDs and types follow the inspected database. */
public record Module(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("module_id") Long moduleId,
        @JsonProperty("module_name") String moduleName,
        @JsonProperty("submodule_name") String submoduleName,
        @JsonProperty("description") String description,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static Module fromRow(Map<String,Object> row) {
        return new Module(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"module_id",Long.class),
            Rows.value(row,"module_name",String.class),
            Rows.value(row,"submodule_name",String.class),
            Rows.value(row,"description",String.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
