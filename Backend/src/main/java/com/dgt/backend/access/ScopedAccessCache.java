package com.dgt.backend.access;
import java.util.*;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.NO)
class ScopedAccessCache {
 Long userId;
 Map<String,Long> companyByStore = new HashMap<>();
 Map<String,Map<String,Boolean>> pageRightsByStore;
}
