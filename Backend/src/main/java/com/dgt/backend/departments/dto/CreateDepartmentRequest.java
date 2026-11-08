package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Creation payload for Department.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateDepartmentRequest(
        @NotBlank @Size(max = 100) String departmentName,
        Boolean isDefault
) {}
