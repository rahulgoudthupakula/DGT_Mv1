package com.dgt.backend.common.config;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;
/** Generic/unfinished routes stay closed; connected workflows use ScopedAccess. */
@Component("accessPolicy")
public class AccessPolicy {
 public boolean check(Authentication authentication,String table,String action){return false;}
}
