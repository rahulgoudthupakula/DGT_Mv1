package com.dgt.backend.departments.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.departments.entity.StoreSubDepartment;
import static com.dgt.backend.departments.database.StoreSubDepartmentDatabase.TABLE;
@Repository
public class StoreSubDepartmentRepository {
    private final SchemaRepository rows;
    public StoreSubDepartmentRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public StoreSubDepartment findById(Long id) { return StoreSubDepartment.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
