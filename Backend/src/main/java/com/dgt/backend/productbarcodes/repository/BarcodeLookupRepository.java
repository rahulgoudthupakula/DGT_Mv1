package com.dgt.backend.productbarcodes.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import static com.dgt.backend.productbarcodes.database.BarcodeLookupDatabase.LOOKUP;

@Repository
public class BarcodeLookupRepository {
    private final JdbcTemplate db;
    public BarcodeLookupRepository(JdbcTemplate db) { this.db=db; }
    public List<Map<String,Object>> lookup(String dgtId,String barcode) { return db.queryForList(LOOKUP,dgtId,dgtId,barcode); }
}
