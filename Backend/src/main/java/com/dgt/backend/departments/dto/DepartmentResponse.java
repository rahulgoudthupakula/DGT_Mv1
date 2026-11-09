package com.dgt.backend.departments.dto;

import com.dgt.backend.departments.entity.Department;

/**
 * Response DTO for stored Department fields.
 */

public record DepartmentResponse(
        Long departmentId,
        String departmentName,
        Boolean isDefault
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static DepartmentResponse from(Department e) {
        return new DepartmentResponse(e.getDepartmentId(), e.getDepartmentName(), e.getIsDefault());
    }
}
