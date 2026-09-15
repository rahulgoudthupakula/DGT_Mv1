package com.dgt.backend.identity.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import static com.dgt.backend.identity.database.AuthenticationDatabase.BY_EMAIL;

@Repository
public class AuthenticationRepository {
    private final JdbcTemplate db;
    public AuthenticationRepository(JdbcTemplate db) { this.db=db; }
    public List<Map<String,Object>> findByEmail(String email) { return db.queryForList(BY_EMAIL,email); }
}
