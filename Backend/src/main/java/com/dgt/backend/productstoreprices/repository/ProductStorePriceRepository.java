package com.dgt.backend.productstoreprices.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.productstoreprices.entity.ProductStorePrice;
import static com.dgt.backend.productstoreprices.database.ProductStorePriceDatabase.TABLE;
@Repository
public class ProductStorePriceRepository {
    private final SchemaRepository rows;
    public ProductStorePriceRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public ProductStorePrice findById(Long id) { return ProductStorePrice.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
