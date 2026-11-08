package com.dgt.backend.identity.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Internal JDBC credential lookup for authentication; returned password hashes must not be exposed as API data.
 */


@Repository
public class AuthenticationRepository {
    private final JdbcTemplate db;
    public AuthenticationRepository(JdbcTemplate db) { this.db=db; }
    // Use a parameterized exact email lookup; the service handles missing or ambiguous results.
    public List<Map<String,Object>> findByEmail(String email) { return db.queryForList("SELECT user_id,email,password_hash,account_status,two_factor_authentication FROM public.users WHERE email=?",email); }
}
