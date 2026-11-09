package com.dgt.backend.departments.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * JDBC lookups and row locks used by department ownership validation.
 * Callers supply the transaction and store authorization; table names are restricted to supported choices.
 */

@Repository
public class DepartmentRulesRepository {
    private final JdbcTemplate db;
    public DepartmentRulesRepository(JdbcTemplate db) { this.db=db; }
    // Share-lock the referenced global definition; unknown identifiers return 404.
    public Map<String,Object> defaultDepartment(Long id) {
        var rows=db.queryForList("SELECT department_id,department_name,is_default FROM public.departments WHERE department_id=? FOR SHARE",id);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Default department not found");
        return rows.getFirst();
    }
    // Select the fixed primary key for an allowed table, then acquire a write lock on that record.
    public Map<String,Object> lock(String table,Object id) {
        String key=switch(table) {
            case "store_departments" -> "store_department_id";
            case "store_sub_departments" -> "store_sub_department_id";
            default -> throw new IllegalArgumentException("Unsupported department table");
        };
        var rows=db.queryForList("SELECT * FROM public."+table+" WHERE "+key+"=? FOR UPDATE",id);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Department not found");
        return rows.getFirst();
    }
}
