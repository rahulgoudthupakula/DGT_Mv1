package com.dgt.backend.stores.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.stores.entity.StoreContactInfo;
import static com.dgt.backend.stores.database.StoreContactInfoDatabase.TABLE;
@Repository
public class StoreContactInfoRepository {
    private final SchemaRepository rows;
    public StoreContactInfoRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public StoreContactInfo findById(Long id) { return StoreContactInfo.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
