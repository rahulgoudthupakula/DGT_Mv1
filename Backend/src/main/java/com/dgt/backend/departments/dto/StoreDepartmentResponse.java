package com.dgt.backend.departments.dto;

import com.dgt.backend.departments.entity.StoreDepartment;
import java.time.OffsetDateTime;

public record StoreDepartmentResponse(
        Long storeDepartmentId,
        String dgtId,
        Long departmentId,
        String storeDepartmentName,
        Boolean isActive,
        String sourceType,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static StoreDepartmentResponse from(StoreDepartment e) {
        return new StoreDepartmentResponse(
                e.getStoreDepartmentId(), e.getDgtId(), e.getDepartmentId(),
                e.getStoreDepartmentName(), e.getIsActive(), e.getSourceType(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
