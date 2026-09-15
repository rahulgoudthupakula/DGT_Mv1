package com.dgt.backend.employees.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.employees; IDs and types follow the inspected database. */
public record Employee(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("employee_id") Long employeeId,
        @JsonProperty("hire_date") LocalDate hireDate,
        @JsonProperty("termination_date") LocalDate terminationDate,
        @JsonProperty("employee_type") String employeeType,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("user_id") Long userId) {
    public static Employee fromRow(Map<String,Object> row) {
        return new Employee(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"employee_id",Long.class),
            Rows.value(row,"hire_date",LocalDate.class),
            Rows.value(row,"termination_date",LocalDate.class),
            Rows.value(row,"employee_type",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"user_id",Long.class));
    }
}
