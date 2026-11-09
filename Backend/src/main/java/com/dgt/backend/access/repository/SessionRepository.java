package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for ProfileSessions. Authorization and transaction boundaries belong to the caller. */
@Repository
public class SessionRepository {
    private final JdbcTemplate db;
    public SessionRepository(JdbcTemplate db) { this.db = db; }

    public int insertLoginEvent(Object userId, Object ipAddress, Object userAgent, Object status) {
        return db.update("INSERT INTO user_login_events(user_id,ip_address,user_agent,status) VALUES (?,?,?,?)", userId, ipAddress, userAgent, status);
    }

    public Map<String,Object> lockCredentials(Object userId) {
        return db.queryForMap("SELECT email,password_hash FROM users WHERE user_id=? FOR UPDATE", userId);
    }

    public Map<String,Object> findActiveEmail(Object userId) {
        return db.queryForMap("SELECT email FROM users WHERE user_id=? AND account_status='ACTIVE'", userId);
    }

    public List<Long> findUserIds(Object email) {
        return db.queryForList("SELECT user_id FROM users WHERE email=?", Long.class, email);
    }

    public List<Map<String,Object>> findHistory(Object userId) {
        return db.queryForList("SELECT event_id,occurred_at,ip_address,user_agent,status FROM user_login_events WHERE user_id=? ORDER BY occurred_at DESC,event_id DESC LIMIT 100", userId);
    }
}
