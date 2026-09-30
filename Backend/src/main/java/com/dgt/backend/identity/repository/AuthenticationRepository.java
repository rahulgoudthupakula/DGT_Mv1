package com.dgt.backend.identity.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;


@Repository
public class AuthenticationRepository {
    private final JdbcTemplate db;
    public AuthenticationRepository(JdbcTemplate db) { this.db=db; }
    public List<Map<String,Object>> findByEmail(String email) { return db.queryForList("SELECT user_id,email,password_hash,account_status,two_factor_authentication FROM public.users WHERE email=?",email); }
}
