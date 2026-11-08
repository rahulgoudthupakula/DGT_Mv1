package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial update payload for StoreDepartment.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateStoreDepartmentRequest(
        @Size(max = 50) String dgtId,
        Long departmentId,
        @Size(max = 100) String storeDepartmentName,
        Boolean isActive,
        @Size(max = 20) String sourceType
) {}
