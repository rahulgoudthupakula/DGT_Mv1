package com.dgt.backend.access;

import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/access")
@ConditionalOnProperty(name = "app.profile.enabled", havingValue = "true")
public class ProfileSessionController {

    private final ScopedAccess access;
    private final ProfileSessions sessions;

    public ProfileSessionController(ScopedAccess access, ProfileSessions sessions) {
        this.access = access;
        this.sessions = sessions;
    }

    @PostMapping("/session")
    public Map<String, Object> login(HttpServletRequest r) {
        String header = r.getHeader("Authorization");
        if (header == null || !header.startsWith("Basic "))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sign in with email and password");
        return sessions.create(r);
    }

    @PostMapping("/session/logout")
    public Map<String, Object> logout() {
        // JWT is stateless — the client discards the token
        return Map.of("signedOut", true);
    }

    @GetMapping("/profile/history")
    public Object history() {
        return access.db.queryForList(
                "SELECT event_id,occurred_at,ip_address,user_agent,status FROM user_login_events WHERE user_id=? ORDER BY occurred_at DESC,event_id DESC LIMIT 100",
                access.user())
                .stream().map(com.dgt.backend.common.entity.Rows::normalize).toList();
    }
}
