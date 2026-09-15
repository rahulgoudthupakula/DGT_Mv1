package com.dgt.backend.departments.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.store_departments; IDs and types follow the inspected database. */
public record StoreDepartment(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("store_department_id") Long storeDepartmentId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("department_id") Long departmentId,
        @JsonProperty("store_department_name") String storeDepartmentName,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("source_type") String sourceType,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static StoreDepartment fromRow(Map<String,Object> row) {
        return new StoreDepartment(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"store_department_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"department_id",Long.class),
            Rows.value(row,"store_department_name",String.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"source_type",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
