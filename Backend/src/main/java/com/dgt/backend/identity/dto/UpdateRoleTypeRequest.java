package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial update payload for RoleType.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateRoleTypeRequest(
        @Size(max = 100) String roleTypeName,
        String description,
        Boolean isActive
) {}
