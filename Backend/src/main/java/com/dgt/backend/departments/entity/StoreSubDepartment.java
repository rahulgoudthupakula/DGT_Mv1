package com.dgt.backend.departments.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.store_sub_departments; IDs and types follow the inspected database. */
public record StoreSubDepartment(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("store_sub_department_id") Long storeSubDepartmentId,
        @JsonProperty("store_department_id") Long storeDepartmentId,
        @JsonProperty("store_sub_department_name") String storeSubDepartmentName,
        @JsonProperty("is_taxable") Boolean isTaxable,
        @JsonProperty("is_active") Boolean isActive,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("source_type") String sourceType) {
    public static StoreSubDepartment fromRow(Map<String,Object> row) {
        return new StoreSubDepartment(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"store_sub_department_id",Long.class),
            Rows.value(row,"store_department_id",Long.class),
            Rows.value(row,"store_sub_department_name",String.class),
            Rows.value(row,"is_taxable",Boolean.class),
            Rows.value(row,"is_active",Boolean.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"source_type",String.class));
    }
}
