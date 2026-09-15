package com.dgt.backend.sales.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.sales.entity.Sale;
import static com.dgt.backend.sales.database.SaleDatabase.TABLE;
@Repository
public class SaleRepository {
    private final SchemaRepository rows;
    public SaleRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public Sale findById(Long id) { return Sale.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
