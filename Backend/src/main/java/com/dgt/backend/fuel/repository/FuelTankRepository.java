package com.dgt.backend.fuel.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.fuel.entity.FuelTank;
import static com.dgt.backend.fuel.database.FuelTankDatabase.TABLE;
@Repository
public class FuelTankRepository {
    private final SchemaRepository rows;
    public FuelTankRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public FuelTank findById(Long id) { return FuelTank.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
