package com.dgt.backend.identity.dto;

import jakarta.validation.constraints.Size;

/**
 * Partial update payload for Module.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdateModuleRequest(
        @Size(max = 100) String moduleName,
        @Size(max = 100) String submoduleName,
        String description,
        Boolean isActive
) {}
