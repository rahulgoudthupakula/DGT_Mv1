package com.dgt.backend.identity.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.identity.entity.Module;
import static com.dgt.backend.identity.database.ModuleDatabase.TABLE;
@Repository
public class ModuleRepository {
    private final SchemaRepository rows;
    public ModuleRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public Module findById(Long id) { return Module.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
