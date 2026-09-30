package com.dgt.backend.departments.dto;

import com.dgt.backend.departments.entity.StoreSubDepartment;
import java.time.OffsetDateTime;

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
    public static StoreSubDepartmentResponse from(StoreSubDepartment e) {
        return new StoreSubDepartmentResponse(
                e.getStoreSubDepartmentId(), e.getStoreDepartmentId(),
                e.getStoreSubDepartmentName(), e.getIsTaxable(), e.getIsActive(),
                e.getSourceType(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
