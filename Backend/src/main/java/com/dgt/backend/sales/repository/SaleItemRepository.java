package com.dgt.backend.sales.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.sales.entity.SaleItem;
import static com.dgt.backend.sales.database.SaleItemDatabase.TABLE;
@Repository
public class SaleItemRepository {
    private final SchemaRepository rows;
    public SaleItemRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public SaleItem findById(Long id) { return SaleItem.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
