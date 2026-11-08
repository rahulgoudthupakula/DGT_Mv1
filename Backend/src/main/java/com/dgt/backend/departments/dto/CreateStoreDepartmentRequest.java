package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Creation payload for StoreDepartment.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateStoreDepartmentRequest(
        @NotBlank @Size(max = 50) String dgtId,
        Long departmentId,
        @NotBlank @Size(max = 100) String storeDepartmentName,
        Boolean isActive,
        @Size(max = 20) String sourceType
) {}
