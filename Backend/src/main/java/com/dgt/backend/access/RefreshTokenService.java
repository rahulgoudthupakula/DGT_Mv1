package com.dgt.backend.access;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class RefreshTokenService {

    private final JdbcTemplate db;
    private final long expirationSeconds;

    public RefreshTokenService(
            JdbcTemplate db,
            @Value("${app.jwt.refresh-expiration-seconds:2592000}") long expirationSeconds) {
        this.db = db;
        this.expirationSeconds = expirationSeconds;
    }

    public long expirationSeconds() { return expirationSeconds; }

    private String hash(String raw) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public String issue(long userId) {
        String raw = UUID.randomUUID().toString();
        db.update(
                "INSERT INTO refresh_tokens(token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                hash(raw), userId, Timestamp.from(Instant.now().plusSeconds(expirationSeconds)));
        return raw;
    }

    /** Validates the token, deletes it, issues a new one. Returns [userId, newRawToken]. */
    public Map.Entry<Long, String> rotate(String rawToken) {
        List<Map<String, Object>> rows = db.queryForList(
                "DELETE FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW() RETURNING user_id",
                hash(rawToken));
        if (rows.isEmpty()) {
            log.warn("Refresh token not found or expired");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token invalid or expired");
        }
        long userId = ((Number) rows.getFirst().get("user_id")).longValue();
        String newRaw = issue(userId);
        log.info("Refresh token rotated for user_id={}", userId);
        return Map.entry(userId, newRaw);
    }

    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        int deleted = db.update("DELETE FROM refresh_tokens WHERE token_hash = ?", hash(rawToken));
        if (deleted > 0) log.info("Refresh token revoked");
    }
}
