package com.dgt.backend.employees.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record CreateEmployeeDocumentRequest(
        @NotNull Long employeeId,
        @Size(max = 100) String documentType,
        @Size(max = 200) String documentName,
        String documentUrl,
        OffsetDateTime uploadedAt
) {}
