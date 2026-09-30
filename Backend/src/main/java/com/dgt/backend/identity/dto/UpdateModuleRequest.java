package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

public record UpdateModuleRequest(
        @Size(max = 100) String moduleName,
        @Size(max = 100) String submoduleName,
        String description,
        Boolean isActive
) {}
