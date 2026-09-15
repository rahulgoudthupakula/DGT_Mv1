package com.dgt.backend.billing.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.billing.entity.BillingInvoice;
import static com.dgt.backend.billing.database.BillingInvoiceDatabase.TABLE;
@Repository
public class BillingInvoiceRepository {
    private final SchemaRepository rows;
    public BillingInvoiceRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public BillingInvoice findById(Long id) { return BillingInvoice.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
