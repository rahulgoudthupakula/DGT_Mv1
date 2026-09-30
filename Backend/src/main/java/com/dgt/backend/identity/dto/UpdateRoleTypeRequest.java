package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

public record UpdateRoleTypeRequest(
        @Size(max = 100) String roleTypeName,
        String description,
        Boolean isActive
) {}
