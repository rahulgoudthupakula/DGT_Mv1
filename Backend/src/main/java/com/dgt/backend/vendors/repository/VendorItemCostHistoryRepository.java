package com.dgt.backend.vendors.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.vendors.entity.VendorItemCostHistory;
import static com.dgt.backend.vendors.database.VendorItemCostHistoryDatabase.TABLE;
@Repository
public class VendorItemCostHistoryRepository {
    private final SchemaRepository rows;
    public VendorItemCostHistoryRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public VendorItemCostHistory findById(Long id) { return VendorItemCostHistory.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
