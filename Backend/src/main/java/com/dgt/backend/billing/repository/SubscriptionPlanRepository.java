package com.dgt.backend.billing.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.billing.entity.SubscriptionPlan;
import static com.dgt.backend.billing.database.SubscriptionPlanDatabase.TABLE;
@Repository
public class SubscriptionPlanRepository {
    private final SchemaRepository rows;
    public SubscriptionPlanRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public SubscriptionPlan findById(Long id) { return SubscriptionPlan.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
