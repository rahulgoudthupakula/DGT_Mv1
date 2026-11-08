package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for EmployeePermissionController; JSON field names remain unchanged. */
public record EmployeePermissionRequest(Map<String,Boolean> overrides,String version){}
