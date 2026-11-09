package com.dgt.backend.access.service;
import com.dgt.backend.access.repository.RefreshTokenRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;

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

/**
 * Stores only SHA-256 hashes of opaque refresh tokens. A successful rotation consumes the old
 * token and issues a replacement; revocation removes the stored refresh credential.
 */

@Slf4j
@Service
public class RefreshTokenService {
 private final RefreshTokenRepository repository;

    private final long expirationSeconds;

    public RefreshTokenService(
            @Value("${app.jwt.refresh-expiration-seconds:2592000}") long expirationSeconds, RefreshTokenRepository repository) {this.repository=repository;
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

    // Return the raw token to the caller once; persist only its hash, owner and expiration.
    public String issue(long userId) {
        String raw = UUID.randomUUID().toString();
        repository.insertToken(hash(raw), userId, Timestamp.from(Instant.now().plusSeconds(expirationSeconds)));
        return raw;
    }

    /** Validates the token, deletes it, issues a new one. Returns [userId, newRawToken]. */
    public Map.Entry<Long, String> rotate(String rawToken) {
        // DELETE RETURNING consumes a valid token once, preventing two rotations from reusing it.
        // Replacement issuance is a separate SQL statement; no transaction is declared on this
        // method.
        List<Map<String, Object>> rows = repository.consumeToken(hash(rawToken));
        if (rows.isEmpty()) {
            log.warn("Refresh token not found or expired");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token invalid or expired");
        }
        long userId = ((Number) rows.getFirst().get("user_id")).longValue();
        String newRaw = issue(userId);
        log.info("Refresh token rotated for user_id={}", userId);
        return Map.entry(userId, newRaw);
    }

    // Deleting the refresh record prevents future refreshes; it does not invalidate signed access
    // JWTs.
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        int deleted = repository.deleteToken(hash(rawToken));
        if (deleted > 0) log.info("Refresh token revoked");
    }
}
