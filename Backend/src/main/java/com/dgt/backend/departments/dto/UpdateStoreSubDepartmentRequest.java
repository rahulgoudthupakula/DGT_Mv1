package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial update payload for StoreSubDepartment.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateStoreSubDepartmentRequest(
        Long storeDepartmentId,
        @Size(max = 100) String storeSubDepartmentName,
        Boolean isTaxable,
        Boolean isActive,
        @Size(max = 20) String sourceType
) {}
