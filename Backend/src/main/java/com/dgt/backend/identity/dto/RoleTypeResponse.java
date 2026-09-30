package com.dgt.backend.identity.dto;

import com.dgt.backend.identity.entity.RoleType;
import java.time.OffsetDateTime;

public record RoleTypeResponse(
        Long roleTypeId,
        String roleTypeName,
        String description,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static RoleTypeResponse from(RoleType e) {
        return new RoleTypeResponse(
                e.getRoleTypeId(), e.getRoleTypeName(), e.getDescription(),
                e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
