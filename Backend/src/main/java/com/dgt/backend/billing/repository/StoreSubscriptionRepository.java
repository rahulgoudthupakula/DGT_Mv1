package com.dgt.backend.billing.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.billing.entity.StoreSubscription;
import static com.dgt.backend.billing.database.StoreSubscriptionDatabase.TABLE;
@Repository
public class StoreSubscriptionRepository {
    private final SchemaRepository rows;
    public StoreSubscriptionRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public StoreSubscription findById(Long id) { return StoreSubscription.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
