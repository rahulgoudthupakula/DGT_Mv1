package com.dgt.backend.departments.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.departments.entity.Department;
import static com.dgt.backend.departments.database.DepartmentDatabase.TABLE;
@Repository
public class DepartmentRepository {
    private final SchemaRepository rows;
    public DepartmentRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public Department findById(Long id) { return Department.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
