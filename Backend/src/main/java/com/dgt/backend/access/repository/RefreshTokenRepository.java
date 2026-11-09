package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for RefreshTokenService. Authorization and transaction boundaries belong to the caller. */
@Repository
public class RefreshTokenRepository {
    private final JdbcTemplate db;
    public RefreshTokenRepository(JdbcTemplate db) { this.db = db; }

    public int insertToken(Object tokenHash, Object userId, Object expiresAt) {
        return db.update("INSERT INTO refresh_tokens(token_hash, user_id, expires_at) VALUES (?, ?, ?)", tokenHash, userId, expiresAt);
    }

    public List<Map<String,Object>> consumeToken(Object tokenHash) {
        return db.queryForList("DELETE FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW() RETURNING user_id", tokenHash);
    }

    public int deleteToken(Object tokenHash) {
        return db.update("DELETE FROM refresh_tokens WHERE token_hash = ?", tokenHash);
    }
}
