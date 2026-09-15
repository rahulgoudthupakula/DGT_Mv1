package com.dgt.backend.vendors.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.vendors.entity.VendorAuditLog;
import static com.dgt.backend.vendors.database.VendorAuditLogDatabase.TABLE;
@Repository
public class VendorAuditLogRepository {
    private final SchemaRepository rows;
    public VendorAuditLogRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public VendorAuditLog findById(Long id) { return VendorAuditLog.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
