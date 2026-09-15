package com.dgt.backend.dailyclosing.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.dailyclosing.entity.DailyExpense;
import static com.dgt.backend.dailyclosing.database.DailyExpenseDatabase.TABLE;
@Repository
public class DailyExpenseRepository {
    private final SchemaRepository rows;
    public DailyExpenseRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public DailyExpense findById(Long id) { return DailyExpense.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
