package com.dgt.backend.promotions.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.promotions.entity.PromotionProduct;
import static com.dgt.backend.promotions.database.PromotionProductDatabase.TABLE;
@Repository
public class PromotionProductRepository {
    private final SchemaRepository rows;
    public PromotionProductRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public PromotionProduct findById(Long id) { return PromotionProduct.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
