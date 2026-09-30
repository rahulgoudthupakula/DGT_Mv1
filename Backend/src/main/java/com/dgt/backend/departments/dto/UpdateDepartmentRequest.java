package com.dgt.backend.departments.dto;

import jakarta.validation.constraints.Size;

public record UpdateDepartmentRequest(
        @Size(max = 100) String departmentName,
        Boolean isDefault
) {}
