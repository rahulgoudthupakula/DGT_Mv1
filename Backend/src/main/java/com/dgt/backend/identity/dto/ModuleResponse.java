package com.dgt.backend.identity.dto;

import com.dgt.backend.identity.entity.Module;
import java.time.OffsetDateTime;

/**
 * Response DTO for stored Module fields.
 */

public record ModuleResponse(
        Long moduleId,
        String moduleName,
        String submoduleName,
        String description,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Copy entity fields to the response without changing the stored record. */
    public static ModuleResponse from(Module e) {
        return new ModuleResponse(
                e.getModuleId(), e.getModuleName(), e.getSubmoduleName(),
                e.getDescription(), e.getIsActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
