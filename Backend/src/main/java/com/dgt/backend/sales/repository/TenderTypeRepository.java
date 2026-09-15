package com.dgt.backend.sales.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.sales.entity.TenderType;
import static com.dgt.backend.sales.database.TenderTypeDatabase.TABLE;
@Repository
public class TenderTypeRepository {
    private final SchemaRepository rows;
    public TenderTypeRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public TenderType findById(Long id) { return TenderType.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
