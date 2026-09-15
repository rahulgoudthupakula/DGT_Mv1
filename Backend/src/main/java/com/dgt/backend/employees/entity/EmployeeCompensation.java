package com.dgt.backend.employees.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.employee_compensation; IDs and types follow the inspected database. */
public record EmployeeCompensation(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("compensation_id") Long compensationId,
        @JsonProperty("employee_id") Long employeeId,
        @JsonProperty("pay_type") String payType,
        @JsonProperty("hourly_rate") BigDecimal hourlyRate,
        @JsonProperty("annual_salary") BigDecimal annualSalary,
        @JsonProperty("effective_from") LocalDate effectiveFrom,
        @JsonProperty("effective_to") LocalDate effectiveTo,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static EmployeeCompensation fromRow(Map<String,Object> row) {
        return new EmployeeCompensation(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"compensation_id",Long.class),
            Rows.value(row,"employee_id",Long.class),
            Rows.value(row,"pay_type",String.class),
            Rows.value(row,"hourly_rate",BigDecimal.class),
            Rows.value(row,"annual_salary",BigDecimal.class),
            Rows.value(row,"effective_from",LocalDate.class),
            Rows.value(row,"effective_to",LocalDate.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
