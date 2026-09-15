package com.dgt.backend.fuel.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.fuel.entity.FuelPump;
import static com.dgt.backend.fuel.database.FuelPumpDatabase.TABLE;
@Repository
public class FuelPumpRepository {
    private final SchemaRepository rows;
    public FuelPumpRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public FuelPump findById(Long id) { return FuelPump.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
