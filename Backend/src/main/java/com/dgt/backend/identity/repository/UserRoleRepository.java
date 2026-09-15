package com.dgt.backend.identity.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.identity.entity.UserRole;
import static com.dgt.backend.identity.database.UserRoleDatabase.TABLE;
@Repository
public class UserRoleRepository {
    private final SchemaRepository rows;
    public UserRoleRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public UserRole findById(Long id) { return UserRole.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
