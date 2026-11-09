package com.dgt.backend.common.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import lombok.extern.slf4j.Slf4j;

/**
 * Basic health and legacy identity endpoints. Request access still depends on SecurityConfig.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1")
public class SystemController {
    // Reports process availability only; this does not probe the database.
    @GetMapping("/health") public Map<String,String> health() { return Map.of("status","UP"); }
    // Legacy principal response; this path is not allowlisted by the current security configuration.
    @GetMapping("/auth/me") public Map<String,Object> me(Authentication authentication) {
        return Map.of("email",authentication.getName(),"accessPolicy","Explicit administrator allowlist; module/store rules pending");
    }
}
