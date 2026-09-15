package com.dgt.backend.stores.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.stores.entity.Store;
import static com.dgt.backend.stores.database.StoreDatabase.TABLE;
@Repository
public class StoreRepository {
    private final SchemaRepository rows;
    public StoreRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public Store findById(String id) { return Store.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(String id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
