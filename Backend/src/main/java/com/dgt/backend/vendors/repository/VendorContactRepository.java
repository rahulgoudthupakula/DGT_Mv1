package com.dgt.backend.vendors.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.vendors.entity.VendorContact;
import static com.dgt.backend.vendors.database.VendorContactDatabase.TABLE;
@Repository
public class VendorContactRepository {
    private final SchemaRepository rows;
    public VendorContactRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public VendorContact findById(Long id) { return VendorContact.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
