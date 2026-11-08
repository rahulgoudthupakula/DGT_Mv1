package com.dgt.backend.employees.dto;

import com.dgt.backend.employees.entity.EmployeeDocument;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored EmployeeDocument fields.
 */

public record EmployeeDocumentResponse(
        Long employeeDocumentId,
        Long employeeId,
        String documentType,
        String documentName,
        String documentUrl,
        OffsetDateTime uploadedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static EmployeeDocumentResponse from(EmployeeDocument e) {
        return new EmployeeDocumentResponse(
                e.getEmployeeDocumentId(), e.getEmployeeId(), e.getDocumentType(),
                e.getDocumentName(), e.getDocumentUrl(), e.getUploadedAt(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
