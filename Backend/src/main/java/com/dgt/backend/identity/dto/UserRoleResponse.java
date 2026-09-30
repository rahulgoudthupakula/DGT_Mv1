package com.dgt.backend.identity.dto;

import com.dgt.backend.identity.entity.UserRole;
import java.time.OffsetDateTime;

public record UserRoleResponse(
        Long userRoleId,
        Long userId,
        Long roleTypeId,
        String dgtId,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static UserRoleResponse from(UserRole e) {
        return new UserRoleResponse(
                e.getUserRoleId(), e.getUserId(), e.getRoleTypeId(),
                e.getDgtId(), e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
