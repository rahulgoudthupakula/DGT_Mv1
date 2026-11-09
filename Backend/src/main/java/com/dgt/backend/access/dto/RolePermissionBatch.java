package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for RoleAccessController; JSON field names remain unchanged. */
public record RolePermissionBatch(List<RolePermissionChange> changes){}
