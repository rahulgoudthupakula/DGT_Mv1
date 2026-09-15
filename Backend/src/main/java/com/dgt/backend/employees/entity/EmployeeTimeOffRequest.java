package com.dgt.backend.employees.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.employee_time_off_requests; IDs and types follow the inspected database. */
public record EmployeeTimeOffRequest(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("time_off_request_id") Long timeOffRequestId,
        @JsonProperty("employee_id") Long employeeId,
        @JsonProperty("request_type") JsonNode requestType,
        @JsonProperty("start_date") LocalDate startDate,
        @JsonProperty("end_date") LocalDate endDate,
        @JsonProperty("hours_requested") BigDecimal hoursRequested,
        @JsonProperty("reason") String reason,
        @JsonProperty("status_type_id") Long statusTypeId,
        @JsonProperty("requested_at") OffsetDateTime requestedAt,
        @JsonProperty("reviewed_by") Long reviewedBy,
        @JsonProperty("reviewed_at") OffsetDateTime reviewedAt,
        @JsonProperty("rejected_reason") String rejectedReason,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static EmployeeTimeOffRequest fromRow(Map<String,Object> row) {
        return new EmployeeTimeOffRequest(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"time_off_request_id",Long.class),
            Rows.value(row,"employee_id",Long.class),
            Rows.value(row,"request_type",JsonNode.class),
            Rows.value(row,"start_date",LocalDate.class),
            Rows.value(row,"end_date",LocalDate.class),
            Rows.value(row,"hours_requested",BigDecimal.class),
            Rows.value(row,"reason",String.class),
            Rows.value(row,"status_type_id",Long.class),
            Rows.value(row,"requested_at",OffsetDateTime.class),
            Rows.value(row,"reviewed_by",Long.class),
            Rows.value(row,"reviewed_at",OffsetDateTime.class),
            Rows.value(row,"rejected_reason",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
