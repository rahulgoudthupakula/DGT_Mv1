package com.dgt.backend.invoices.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.invoices.entity.InvoiceCharge;
import static com.dgt.backend.invoices.database.InvoiceChargeDatabase.TABLE;
@Repository
public class InvoiceChargeRepository {
    private final SchemaRepository rows;
    public InvoiceChargeRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public InvoiceCharge findById(Long id) { return InvoiceCharge.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
