package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial update payload for Department.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateDepartmentRequest(
        @Size(max = 100) String departmentName,
        Boolean isDefault
) {}
