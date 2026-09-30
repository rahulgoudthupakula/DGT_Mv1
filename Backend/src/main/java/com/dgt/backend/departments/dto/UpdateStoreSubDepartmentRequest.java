package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.Size;

public record UpdateStoreSubDepartmentRequest(
        Long storeDepartmentId,
        @Size(max = 100) String storeSubDepartmentName,
        Boolean isTaxable,
        Boolean isActive,
        @Size(max = 20) String sourceType
) {}
