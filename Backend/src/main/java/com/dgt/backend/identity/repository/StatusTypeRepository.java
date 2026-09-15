package com.dgt.backend.identity.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.identity.entity.StatusType;
import static com.dgt.backend.identity.database.StatusTypeDatabase.TABLE;
@Repository
public class StatusTypeRepository {
    private final SchemaRepository rows;
    public StatusTypeRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public StatusType findById(Long id) { return StatusType.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
