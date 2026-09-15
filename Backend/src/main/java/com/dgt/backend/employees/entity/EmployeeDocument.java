package com.dgt.backend.employees.entity;

import java.util.Map;
import java.math.BigDecimal;
import java.time.*;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dgt.backend.common.entity.Rows;
/** Persistence model for public.employee_documents; IDs and types follow the inspected database. */
public record EmployeeDocument(
        @JsonProperty("_version") String rowVersion,
        @JsonProperty("employee_document_id") Long employeeDocumentId,
        @JsonProperty("employee_id") Long employeeId,
        @JsonProperty("document_type") String documentType,
        @JsonProperty("document_name") String documentName,
        @JsonProperty("document_url") String documentUrl,
        @JsonProperty("uploaded_at") OffsetDateTime uploadedAt,
        @JsonProperty("created_at") OffsetDateTime createdAt,
        @JsonProperty("updated_at") OffsetDateTime updatedAt) {
    public static EmployeeDocument fromRow(Map<String,Object> row) {
        return new EmployeeDocument(
            Rows.value(row,"_version",String.class),
            Rows.value(row,"employee_document_id",Long.class),
            Rows.value(row,"employee_id",Long.class),
            Rows.value(row,"document_type",String.class),
            Rows.value(row,"document_name",String.class),
            Rows.value(row,"document_url",String.class),
            Rows.value(row,"uploaded_at",OffsetDateTime.class),
            Rows.value(row,"created_at",OffsetDateTime.class),
            Rows.value(row,"updated_at",OffsetDateTime.class));
    }
}
