package com.dgt.backend.access.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Fixed JDBC statements for ProfileService. Authorization and transaction boundaries belong to the caller. */
@Repository
public class ProfileRepository {
    private final JdbcTemplate db;
    public ProfileRepository(JdbcTemplate db) { this.db = db; }

    public Map<String,Object> findProfile(Object userId) {
        return db.queryForMap("SELECT first_name,last_name,email,xmin::text AS version FROM users WHERE user_id=?", userId);
    }

    public Map<String,Object> lockAccount(Object userId) {
        return db.queryForMap("SELECT user_id,email,password_hash,xmin::text AS version FROM users WHERE user_id=? FOR UPDATE", userId);
    }

    public Boolean emailInUse(Object email, Object userId) {
        return db.queryForObject("SELECT EXISTS(SELECT 1 FROM users WHERE lower(email)=? AND user_id<>?)", Boolean.class, email, userId);
    }

    public int updateProfile(Object firstName, Object lastName, Object email, Object userId) {
        return db.update("UPDATE users SET first_name=?,last_name=?,email=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?", firstName, lastName, email, userId);
    }

    public int updatePassword(Object passwordHash, Object userId) {
        return db.update("UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?", passwordHash, userId);
    }
}
