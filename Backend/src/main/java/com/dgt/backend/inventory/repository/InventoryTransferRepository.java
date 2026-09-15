package com.dgt.backend.inventory.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.inventory.entity.InventoryTransfer;
import static com.dgt.backend.inventory.database.InventoryTransferDatabase.TABLE;
@Repository
public class InventoryTransferRepository {
    private final SchemaRepository rows;
    public InventoryTransferRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public InventoryTransfer findById(Long id) { return InventoryTransfer.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
