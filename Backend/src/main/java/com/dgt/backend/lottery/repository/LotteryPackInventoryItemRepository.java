package com.dgt.backend.lottery.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.lottery.entity.LotteryPackInventoryItem;
import static com.dgt.backend.lottery.database.LotteryPackInventoryItemDatabase.TABLE;
@Repository
public class LotteryPackInventoryItemRepository {
    private final SchemaRepository rows;
    public LotteryPackInventoryItemRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public LotteryPackInventoryItem findById(Long id) { return LotteryPackInventoryItem.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
