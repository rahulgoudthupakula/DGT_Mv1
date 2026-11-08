package com.dgt.backend.access.security;

import java.util.*;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

/**
 * Per-request memoization of user identity, store/company lookup and effective page rights. It is
 * not a cross-request session cache: each HTTP request resolves its own current access state.
 */
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.NO)
class ScopedAccessCache {
 // Memoized fields live only for this request; never use this object as durable permission
 // storage.
 Long userId;
 Map<String,Long> companyByStore = new HashMap<>();
 Map<String,Map<String,Boolean>> pageRightsByStore;
}
