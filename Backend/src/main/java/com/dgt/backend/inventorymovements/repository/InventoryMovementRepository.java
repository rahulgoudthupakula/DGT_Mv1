package com.dgt.backend.inventorymovements.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.inventorymovements.entity.InventoryMovement;
import static com.dgt.backend.inventorymovements.database.InventoryMovementDatabase.TABLE;
@Repository
public class InventoryMovementRepository {
    private final SchemaRepository rows;
    public InventoryMovementRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public InventoryMovement findById(Long id) { return InventoryMovement.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
