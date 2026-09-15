package com.dgt.backend.productstoreprices.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.productstoreprices.entity.ProductPriceGroup;
import static com.dgt.backend.productstoreprices.database.ProductPriceGroupDatabase.TABLE;
@Repository
public class ProductPriceGroupRepository {
    private final SchemaRepository rows;
    public ProductPriceGroupRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public ProductPriceGroup findById(Long id) { return ProductPriceGroup.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
