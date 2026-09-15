package com.dgt.backend.inventory.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.inventory.entity.Inventory;
import static com.dgt.backend.inventory.database.InventoryDatabase.TABLE;
@Repository
public class InventoryRepository {
    private final SchemaRepository rows;
    public InventoryRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public Inventory findById(Long id) { return Inventory.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
