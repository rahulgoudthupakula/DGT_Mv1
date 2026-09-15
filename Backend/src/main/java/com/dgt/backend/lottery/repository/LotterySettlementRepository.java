package com.dgt.backend.lottery.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.lottery.entity.LotterySettlement;
import static com.dgt.backend.lottery.database.LotterySettlementDatabase.TABLE;
@Repository
public class LotterySettlementRepository {
    private final SchemaRepository rows;
    public LotterySettlementRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public LotterySettlement findById(Long id) { return LotterySettlement.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
