package com.dgt.backend.employees.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.employee_schedules; IDs and types follow the inspected database. */
public record EmployeeSchedule(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("schedule_id") Long scheduleId,
        @JsonProperty("employee_id") Long employeeId,
        @JsonProperty("dgt_id") String dgtId,
        @JsonProperty("work_date") LocalDate workDate,
        @JsonProperty("schedule_start") OffsetDateTime scheduleStart,
        @JsonProperty("schedule_end") OffsetDateTime scheduleEnd,
        @JsonProperty("status") String status,
        @JsonProperty("notes") String notes,
        @JsonProperty("created_by") Long createdBy,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static EmployeeSchedule fromRow(Map<String,Object> row) {
        return new EmployeeSchedule(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"schedule_id",Long.class),
            Rows.value(row,"employee_id",Long.class),
            Rows.value(row,"dgt_id",String.class),
            Rows.value(row,"work_date",LocalDate.class),
            Rows.value(row,"schedule_start",OffsetDateTime.class),
            Rows.value(row,"schedule_end",OffsetDateTime.class),
            Rows.value(row,"status",String.class),
            Rows.value(row,"notes",String.class),
            Rows.value(row,"created_by",Long.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
