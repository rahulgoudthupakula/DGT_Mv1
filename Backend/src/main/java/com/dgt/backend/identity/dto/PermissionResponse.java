package com.dgt.backend.identity.dto;

import com.dgt.backend.identity.entity.Permission;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored Permission fields.
 */

public record PermissionResponse(
        Long permissionId,
        Long moduleId,
        Long userRoleId,
        Boolean isActive,
        Boolean canView,
        Boolean canEdit,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static PermissionResponse from(Permission e) {
        return new PermissionResponse(
                e.getPermissionId(), e.getModuleId(), e.getUserRoleId(),
                e.getIsActive(), e.getCanView(), e.getCanEdit(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
