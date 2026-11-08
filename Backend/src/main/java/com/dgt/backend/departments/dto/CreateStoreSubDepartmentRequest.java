package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Creation payload for StoreSubDepartment.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateStoreSubDepartmentRequest(
        @NotNull Long storeDepartmentId,
        @NotBlank @Size(max = 100) String storeSubDepartmentName,
        Boolean isTaxable,
        Boolean isActive,
        @Size(max = 20) String sourceType
) {}
