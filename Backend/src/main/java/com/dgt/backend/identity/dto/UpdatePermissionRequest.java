package com.dgt.backend.identity.dto;

public record UpdatePermissionRequest(
        Long moduleId,
        Long userRoleId,
        Boolean isActive,
        Boolean canView,
        Boolean canEdit
) {}
