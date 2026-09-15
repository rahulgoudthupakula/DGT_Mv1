package com.dgt.backend.employees.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.employee_store_assignments; IDs and types follow the inspected database. */
public record EmployeeStoreAssignment(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("employee_store_assignment_id") Long employeeStoreAssignmentId,
        @JsonProperty("employee_id") Long employeeId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("is_primary") Boolean isPrimary,
        @JsonProperty("effective_from") LocalDate effectiveFrom,
        @JsonProperty("effective_to") LocalDate effectiveTo,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("role_type_id") Long roleTypeId) {
    public static EmployeeStoreAssignment fromRow(Map<String,Object> row) {
        return new EmployeeStoreAssignment(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"employee_store_assignment_id",Long.class),
            Rows.value(row,"employee_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"is_primary",Boolean.class),
            Rows.value(row,"effective_from",LocalDate.class),
            Rows.value(row,"effective_to",LocalDate.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"role_type_id",Long.class));
    }
}
