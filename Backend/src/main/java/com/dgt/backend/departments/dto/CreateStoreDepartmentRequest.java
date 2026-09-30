package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStoreDepartmentRequest(
        @NotBlank @Size(max = 50) String dgtId,
        Long departmentId,
        @NotBlank @Size(max = 100) String storeDepartmentName,
        Boolean isActive,
        @Size(max = 20) String sourceType
) {}
