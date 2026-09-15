package com.dgt.backend.employees.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.employee_emergency_contacts; IDs and types follow the inspected database. */
public record EmployeeEmergencyContact(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("emergency_contact_id") Long emergencyContactId,
        @JsonProperty("employee_id") Long employeeId,
        @JsonProperty("contact_name") String contactName,
        @JsonProperty("relationship") String relationship,
        @JsonProperty("phone") String phone,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static EmployeeEmergencyContact fromRow(Map<String,Object> row) {
        return new EmployeeEmergencyContact(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"emergency_contact_id",Long.class),
            Rows.value(row,"employee_id",Long.class),
            Rows.value(row,"contact_name",String.class),
            Rows.value(row,"relationship",String.class),
            Rows.value(row,"phone",String.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
