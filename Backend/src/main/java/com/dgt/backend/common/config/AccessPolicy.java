package com.dgt.backend.common.config;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;

/**
 * Method-security gate for unfinished generic APIs. Connected workflows enforce access through ScopedAccess.
 */
/** Generic/unfinished routes stay closed; connected workflows use ScopedAccess. */
@Component("accessPolicy")
public class AccessPolicy {
 // Always deny regardless of the supplied user, table, or operation.
 public boolean check(Authentication authentication,String table,String action){return false;}
}
