package com.dgt.backend.fuel.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.fuel.entity.FuelInvoiceDetail;
import static com.dgt.backend.fuel.database.FuelInvoiceDetailDatabase.TABLE;
@Repository
public class FuelInvoiceDetailRepository {
    private final SchemaRepository rows;
    public FuelInvoiceDetailRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public FuelInvoiceDetail findById(Long id) { return FuelInvoiceDetail.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
