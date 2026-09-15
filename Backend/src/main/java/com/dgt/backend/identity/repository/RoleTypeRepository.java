package com.dgt.backend.identity.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.identity.entity.RoleType;
import static com.dgt.backend.identity.database.RoleTypeDatabase.TABLE;
@Repository
public class RoleTypeRepository {
    private final SchemaRepository rows;
    public RoleTypeRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public RoleType findById(Long id) { return RoleType.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
