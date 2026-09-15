package com.dgt.backend.common.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SchemaInspectionRepository {
    private final JdbcTemplate db;
    public SchemaInspectionRepository(JdbcTemplate db) { this.db=db; }
    public Map<String,String> columnTypes() {
        Map<String,String> columns=new HashMap<>();
        db.queryForList("SELECT table_name,column_name,udt_name FROM information_schema.columns WHERE table_schema='public'")
            .forEach(r -> columns.put(r.get("table_name")+"."+r.get("column_name"),(String)r.get("udt_name")));
        return columns;
    }
}
