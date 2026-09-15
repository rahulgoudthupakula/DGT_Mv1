package com.dgt.backend.vendors.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.vendors.entity.Vendor;
import static com.dgt.backend.vendors.database.VendorDatabase.TABLE;
@Repository
public class VendorRepository {
    private final SchemaRepository rows;
    public VendorRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public Vendor findById(Long id) { return Vendor.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
