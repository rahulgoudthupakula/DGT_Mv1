package com.dgt.backend.employees.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.employees.entity.EmployeeDocument;
import static com.dgt.backend.employees.database.EmployeeDocumentDatabase.TABLE;
@Repository
public class EmployeeDocumentRepository {
    private final SchemaRepository rows;
    public EmployeeDocumentRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public EmployeeDocument findById(Long id) { return EmployeeDocument.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
