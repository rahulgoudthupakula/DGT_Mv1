package com.dgt.backend.productstoreprices.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.productstoreprices.entity.PriceGroup;
import static com.dgt.backend.productstoreprices.database.PriceGroupDatabase.TABLE;
@Repository
public class PriceGroupRepository {
    private final SchemaRepository rows;
    public PriceGroupRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public PriceGroup findById(Long id) { return PriceGroup.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
