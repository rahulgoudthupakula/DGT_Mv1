package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

public record CreateUserRoleRequest(
        Long userId,
        Long roleTypeId,
        @Size(max = 50) String dgtId,
        Boolean isActive
) {}
