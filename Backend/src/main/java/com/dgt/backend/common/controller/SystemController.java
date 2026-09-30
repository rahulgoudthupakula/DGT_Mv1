package com.dgt.backend.common.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1")
public class SystemController {
    @GetMapping("/health") public Map<String,String> health() { return Map.of("status","UP"); }
    @GetMapping("/auth/me") public Map<String,Object> me(Authentication authentication) {
        return Map.of("email",authentication.getName(),"accessPolicy","Explicit administrator allowlist; module/store rules pending");
    }
}
