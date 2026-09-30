package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateStoreSubDepartmentRequest(
        @NotNull Long storeDepartmentId,
        @NotBlank @Size(max = 100) String storeSubDepartmentName,
        Boolean isTaxable,
        Boolean isActive,
        @Size(max = 20) String sourceType
) {}
