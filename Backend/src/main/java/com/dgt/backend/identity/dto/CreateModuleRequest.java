package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateModuleRequest(
        @NotBlank @Size(max = 100) String moduleName,
        @Size(max = 100) String submoduleName,
        String description,
        Boolean isActive
) {}
