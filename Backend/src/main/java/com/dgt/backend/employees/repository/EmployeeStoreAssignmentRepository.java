package com.dgt.backend.employees.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.employees.entity.EmployeeStoreAssignment;
import static com.dgt.backend.employees.database.EmployeeStoreAssignmentDatabase.TABLE;
@Repository
public class EmployeeStoreAssignmentRepository {
    private final SchemaRepository rows;
    public EmployeeStoreAssignmentRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public EmployeeStoreAssignment findById(Long id) { return EmployeeStoreAssignment.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
