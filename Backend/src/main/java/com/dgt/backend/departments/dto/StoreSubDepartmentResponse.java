package com.dgt.backend.departments.dto;

import com.dgt.backend.departments.entity.StoreSubDepartment;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored StoreSubDepartment fields.
 */

public record StoreSubDepartmentResponse(
        Long storeSubDepartmentId,
        Long storeDepartmentId,
        String storeSubDepartmentName,
        Boolean isTaxable,
        Boolean isActive,
        String sourceType,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static StoreSubDepartmentResponse from(StoreSubDepartment e) {
        return new StoreSubDepartmentResponse(
                e.getStoreSubDepartmentId(), e.getStoreDepartmentId(),
                e.getStoreSubDepartmentName(), e.getIsTaxable(), e.getIsActive(),
                e.getSourceType(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
