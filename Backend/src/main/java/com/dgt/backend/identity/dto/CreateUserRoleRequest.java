package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

/**
 * Creation payload for UserRole.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateUserRoleRequest(
        Long userId,
        Long roleTypeId,
        @Size(max = 50) String dgtId,
        Boolean isActive
) {}
