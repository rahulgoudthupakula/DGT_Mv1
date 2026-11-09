package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for RoleAccessController; JSON field names remain unchanged. */
public record RolePermissionChange(long roleTypeId,String code,boolean allowed,String version){}
