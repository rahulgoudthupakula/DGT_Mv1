package com.dgt.backend.productvendors.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.productvendors.entity.ProductVendor;
import static com.dgt.backend.productvendors.database.ProductVendorDatabase.TABLE;
@Repository
public class ProductVendorRepository {
    private final SchemaRepository rows;
    public ProductVendorRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public ProductVendor findById(Long id) { return ProductVendor.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
