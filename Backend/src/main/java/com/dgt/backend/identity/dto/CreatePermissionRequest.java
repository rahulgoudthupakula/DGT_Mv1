package com.dgt.backend.identity.dto;

public record CreatePermissionRequest(
        Long moduleId,
        Long userRoleId,
        Boolean isActive,
        Boolean canView,
        Boolean canEdit
) {}
