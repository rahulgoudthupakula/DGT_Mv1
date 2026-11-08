package com.dgt.backend.identity.dto;

/**
 * Partial update payload for Permission.
 * The service ignores null fields, so omitted values are preserved rather than cleared.
 */

public record UpdatePermissionRequest(
        Long moduleId,
        Long userRoleId,
        Boolean isActive,
        Boolean canView,
        Boolean canEdit
) {}
