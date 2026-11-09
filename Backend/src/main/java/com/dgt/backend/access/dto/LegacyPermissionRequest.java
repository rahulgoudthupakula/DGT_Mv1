package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for AccessController; JSON field names remain unchanged. */
public record LegacyPermissionRequest(long roleId,long moduleId,boolean view,boolean edit,String version){}
