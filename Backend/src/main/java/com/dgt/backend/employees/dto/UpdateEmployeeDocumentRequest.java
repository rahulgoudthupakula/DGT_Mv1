package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

/**
 * Partial update payload for EmployeeDocument.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateEmployeeDocumentRequest(
        Long employeeId,
        @Size(max = 100) String documentType,
        @Size(max = 200) String documentName,
        String documentUrl,
        OffsetDateTime uploadedAt
) {}
