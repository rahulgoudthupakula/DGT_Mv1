package com.dgt.backend.identity.dto;

/**
 * Creation payload for Permission.
 * Bean Validation annotations declare field requirements for the generic API.
 */

public record CreatePermissionRequest(
        Long moduleId,
        Long userRoleId,
        Boolean isActive,
        Boolean canView,
        Boolean canEdit
) {}
