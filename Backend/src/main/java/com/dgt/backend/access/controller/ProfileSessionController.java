package com.dgt.backend.access.controller;
import com.dgt.backend.access.service.ProfileSessions;
import com.dgt.backend.access.dto.RefreshSessionRequest;

import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Session HTTP endpoints for Basic-header login, refresh-token rotation, logout and recent login
 * history. Credential and token operations are delegated to ProfileSessions.
 */

@RestController
@RequestMapping("/api/v1/access")
@ConditionalOnProperty(name = "app.profile.enabled", havingValue = "true")
public class ProfileSessionController {

    private final ProfileSessions sessions;

    public ProfileSessionController(ProfileSessions sessions) {
        this.sessions = sessions;
    }

    // Require the Basic header contract before passing credential verification to the session
    // service.
    @PostMapping("/session")
    public Map<String, Object> login(HttpServletRequest r) {
        String header = r.getHeader("Authorization");
        if (header == null || !header.startsWith("Basic "))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sign in with email and password");
        return sessions.create(r);
    }

    // Exchange a nonblank refresh token for a new access/refresh pair.
    @PostMapping("/session/refresh")
    public Map<String, Object> refresh(@RequestBody RefreshSessionRequest body) {
        if (body.refreshToken() == null || body.refreshToken().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "refreshToken required");
        return sessions.refresh(body.refreshToken());
    }

    // Revoke the supplied refresh token if present; an already-issued access JWT is not removed
    // here.
    @PostMapping("/session/logout")
    public Map<String, Object> logout(@RequestBody(required = false) RefreshSessionRequest body) {
        if (body != null && body.refreshToken() != null)
            sessions.revokeRefreshToken(body.refreshToken());
        return Map.of("signedOut", true);
    }

    // Return only the signed-in user history, newest first, capped at 100 events.
    @GetMapping("/profile/history")
    public Object history() {
        return sessions.history();
    }
}
