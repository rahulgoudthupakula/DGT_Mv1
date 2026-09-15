package com.dgt.backend.employees.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.employees.entity.EmployeeCompensation;
import static com.dgt.backend.employees.database.EmployeeCompensationDatabase.TABLE;
@Repository
public class EmployeeCompensationRepository {
    private final SchemaRepository rows;
    public EmployeeCompensationRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public EmployeeCompensation findById(Long id) { return EmployeeCompensation.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
