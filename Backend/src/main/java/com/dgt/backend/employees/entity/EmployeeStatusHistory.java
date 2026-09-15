package com.dgt.backend.employees.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.employee_status_history; IDs and types follow the inspected database. */
public record EmployeeStatusHistory(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("status_history_id") Long statusHistoryId,
        @JsonProperty("employee_id") Long employeeId,
        @JsonProperty("status") String status,
        @JsonProperty("status_type_id") Long statusTypeId) {
    public static EmployeeStatusHistory fromRow(Map<String,Object> row) {
        return new EmployeeStatusHistory(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"status_history_id",Long.class),
            Rows.value(row,"employee_id",Long.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"status_type_id",Long.class));
    }
}
