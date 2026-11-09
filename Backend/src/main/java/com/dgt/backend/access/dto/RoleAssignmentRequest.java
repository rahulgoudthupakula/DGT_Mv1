package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for AccessController; JSON field names remain unchanged. */
public record RoleAssignmentRequest(long userId,long roleTypeId,Boolean active,String version){}
