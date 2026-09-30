package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoleTypeRequest(
        @NotBlank @Size(max = 100) String roleTypeName,
        String description,
        Boolean isActive
) {}
