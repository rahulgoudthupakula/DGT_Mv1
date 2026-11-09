package com.dgt.backend.departments.dto;

import com.dgt.backend.departments.entity.StoreDepartment;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored StoreDepartment fields.
 */

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
    /** Copy entity fields to the response without changing the stored record. */
    public static StoreDepartmentResponse from(StoreDepartment e) {
        return new StoreDepartmentResponse(
                e.getStoreDepartmentId(), e.getDgtId(), e.getDepartmentId(),
                e.getStoreDepartmentName(), e.getIsActive(), e.getSourceType(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
