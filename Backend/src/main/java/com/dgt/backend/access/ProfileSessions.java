package com.dgt.backend.access;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.profile.enabled", havingValue = "true")
public class ProfileSessions {

    private final ScopedAccess access;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final RefreshTokenService refreshTokens;

    private static final java.util.concurrent.ConcurrentHashMap<String, long[]> RATE =
            new java.util.concurrent.ConcurrentHashMap<>();
    private static final long RATE_MS = 5 * 60_000L;
    private static final int RATE_MAX = 10;

    public ProfileSessions(ScopedAccess access, PasswordEncoder encoder, JwtService jwt, RefreshTokenService refreshTokens) {
        this.access = access;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refreshTokens = refreshTokens;
    }

    public static String digest(String text) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private void checkRate(String ip) {
        long now = System.currentTimeMillis();
        var w = RATE.compute(ip, (k, v) -> {
            if (v == null || now - v[0] > RATE_MS) return new long[]{now, 1};
            v[1]++;
            return v;
        });
        if (w[1] > RATE_MAX) throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.TOO_MANY_REQUESTS, "Too many sign-in attempts; try again later");
    }

    private String agent(HttpServletRequest r) {
        String a = r.getHeader("User-Agent");
        return a == null ? "Unknown" : a.substring(0, Math.min(a.length(), 512));
    }

    private void event(long uid, HttpServletRequest r, String status) {
        try {
            access.db.update(
                    "INSERT INTO user_login_events(user_id,ip_address,user_agent,status) VALUES (?,?,?,?)",
                    uid, r.getRemoteAddr(), agent(r), status);
        } catch (Exception e) {
            log.warn("Could not write login event: {}", e.getMessage());
        }
    }

    public Map<String, Object> create(HttpServletRequest request) {
        checkRate(request.getRemoteAddr());
        String raw = new String(Base64.getDecoder().decode(
                request.getHeader("Authorization").substring(6)), StandardCharsets.UTF_8);
        int colon = raw.indexOf(':');
        if (colon < 0) throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Sign in again");
        String email = raw.substring(0, colon);
        String password = raw.substring(colon + 1);

        var rows = access.db.queryForList(
                "SELECT user_id,email,password_hash FROM users WHERE email=? AND account_status='ACTIVE' AND two_factor_authentication=false FOR UPDATE",
                email);
        boolean valid = rows.size() == 1 && encoder.matches(password, (String) rows.getFirst().get("password_hash"));
        if (!valid) {
            if (rows.size() == 1) event((Long) rows.getFirst().get("user_id"), request, "FAILED");
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Sign in again");
        }

        long uid = (Long) rows.getFirst().get("user_id");
        String resolvedEmail = (String) rows.getFirst().get("email");
        String token = jwt.issue(resolvedEmail);
        String refreshToken = refreshTokens.issue(uid);
        event(uid, request, "SUCCESS");
        log.info("JWT issued for user_id={}", uid);
        return Map.of(
                "token", token,
                "expiresIn", jwt.expirationSeconds(),
                "refreshToken", refreshToken,
                "refreshExpiresIn", refreshTokens.expirationSeconds());
    }

    public Map<String, Object> refresh(String rawRefreshToken) {
        var entry = refreshTokens.rotate(rawRefreshToken);
        long uid = entry.getKey();
        String newRefreshToken = entry.getValue();
        var u = access.db.queryForMap("SELECT email FROM users WHERE user_id=? AND account_status='ACTIVE'", uid);
        String token = jwt.issue((String) u.get("email"));
        log.info("JWT refreshed for user_id={}", uid);
        return Map.of(
                "token", token,
                "expiresIn", jwt.expirationSeconds(),
                "refreshToken", newRefreshToken,
                "refreshExpiresIn", refreshTokens.expirationSeconds());
    }

    public void revokeRefreshToken(String rawRefreshToken) {
        refreshTokens.revoke(rawRefreshToken);
    }

    public void failed(HttpServletRequest request) {
        if (!request.getRequestURI().equals("/api/v1/access/session") || !request.getMethod().equals("POST")) return;
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Basic ") || header.length() > 4096) return;
        try {
            String decoded = new String(Base64.getDecoder().decode(header.substring(6)), StandardCharsets.UTF_8);
            int colon = decoded.indexOf(':');
            if (colon < 0) return;
            String email = decoded.substring(0, colon);
            var users = access.db.queryForList("SELECT user_id FROM users WHERE email=?", Long.class, email);
            if (users.size() == 1) event(users.getFirst(), request, "FAILED");
        } catch (IllegalArgumentException ignored) {}
    }
}
