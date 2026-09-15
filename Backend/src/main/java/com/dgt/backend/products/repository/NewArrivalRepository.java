package com.dgt.backend.products.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.products.entity.NewArrival;
import static com.dgt.backend.products.database.NewArrivalDatabase.TABLE;
@Repository
public class NewArrivalRepository {
    private final SchemaRepository rows;
    public NewArrivalRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public NewArrival findById(Long id) { return NewArrival.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
