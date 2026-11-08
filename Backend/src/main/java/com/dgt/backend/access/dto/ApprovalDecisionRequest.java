package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for ApprovalController; JSON field names remain unchanged. */
public record ApprovalDecisionRequest(String decision,String note){}
