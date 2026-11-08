package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Creation payload for RoleType.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreateRoleTypeRequest(
        @NotBlank @Size(max = 100) String roleTypeName,
        String description,
        Boolean isActive
) {}
