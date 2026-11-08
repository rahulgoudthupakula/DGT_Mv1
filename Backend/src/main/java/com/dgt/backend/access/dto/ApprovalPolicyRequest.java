package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for AccessController; JSON field names remain unchanged. */
public record ApprovalPolicyRequest(long moduleId,boolean required,String version){}
