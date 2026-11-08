package com.dgt.backend.identity.dto;

import com.dgt.backend.identity.entity.RoleType;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored RoleType fields.
 */

public record RoleTypeResponse(
        Long roleTypeId,
        String roleTypeName,
        String description,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static RoleTypeResponse from(RoleType e) {
        return new RoleTypeResponse(
                e.getRoleTypeId(), e.getRoleTypeName(), e.getDescription(),
                e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
