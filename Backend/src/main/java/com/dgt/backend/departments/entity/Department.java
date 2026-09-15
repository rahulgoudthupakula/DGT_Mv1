package com.dgt.backend.departments.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.departments; IDs and types follow the inspected database. */
public record Department(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("department_id") Long departmentId,
        @JsonProperty("department_name") String departmentName,
        @JsonProperty("is_default") Boolean isDefault) {
    public static Department fromRow(Map<String,Object> row) {
        return new Department(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"department_id",Long.class),
            Rows.value(row,"department_name",String.class),
            Rows.value(row,"is_default",Boolean.class));
    }
}
