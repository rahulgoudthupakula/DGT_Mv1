package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial update payload for UserRole.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateUserRoleRequest(
        Long userId,
        Long roleTypeId,
        @Size(max = 50) String dgtId,
        Boolean isActive
) {}
