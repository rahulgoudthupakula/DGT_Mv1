package com.dgt.backend.departments.dto;

import com.dgt.backend.departments.entity.Department;

public record DepartmentResponse(
        Long departmentId,
        String departmentName,
        Boolean isDefault
) {
    public static DepartmentResponse from(Department e) {
        return new DepartmentResponse(e.getDepartmentId(), e.getDepartmentName(), e.getIsDefault());
    }
}
