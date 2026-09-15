package com.dgt.backend.lottery.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.lottery.entity.LotteryPackInventory;
import static com.dgt.backend.lottery.database.LotteryPackInventoryDatabase.TABLE;
@Repository
public class LotteryPackInventoryRepository {
    private final SchemaRepository rows;
    public LotteryPackInventoryRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public LotteryPackInventory findById(Long id) { return LotteryPackInventory.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
