package com.dgt.backend.dailyclosing.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.dailyclosing.entity.DailyClosingTender;
import static com.dgt.backend.dailyclosing.database.DailyClosingTenderDatabase.TABLE;
@Repository
public class DailyClosingTenderRepository {
    private final SchemaRepository rows;
    public DailyClosingTenderRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public DailyClosingTender findById(Long id) { return DailyClosingTender.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
