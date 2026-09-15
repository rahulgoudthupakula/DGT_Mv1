package com.dgt.backend.employees.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.employee_time_entries; IDs and types follow the inspected database. */
public record EmployeeTimeEntrie(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("time_entry_id") Long timeEntryId,
        @JsonProperty("employee_id") Long employeeId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("clock_in") OffsetDateTime clockIn,
        @JsonProperty("clock_out") OffsetDateTime clockOut,
        @JsonProperty("regular_hours") BigDecimal regularHours,
        @JsonProperty("overtime_hours") BigDecimal overtimeHours,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt,
        @JsonProperty("event_type") String eventType) {
    public static EmployeeTimeEntrie fromRow(Map<String,Object> row) {
        return new EmployeeTimeEntrie(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"time_entry_id",Long.class),
            Rows.value(row,"employee_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"clock_in",OffsetDateTime.class),
            Rows.value(row,"clock_out",OffsetDateTime.class),
            Rows.value(row,"regular_hours",BigDecimal.class),
            Rows.value(row,"overtime_hours",BigDecimal.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class),
            Rows.value(row,"event_type",String.class));
    }
}
