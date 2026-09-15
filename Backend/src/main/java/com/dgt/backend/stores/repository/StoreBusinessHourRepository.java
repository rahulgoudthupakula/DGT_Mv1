package com.dgt.backend.stores.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.stores.entity.StoreBusinessHour;
import static com.dgt.backend.stores.database.StoreBusinessHourDatabase.TABLE;
@Repository
public class StoreBusinessHourRepository {
    private final SchemaRepository rows;
    public StoreBusinessHourRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public StoreBusinessHour findById(Long id) { return StoreBusinessHour.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
