package com.dgt.backend.invoices.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.invoices.entity.Invoice;
import static com.dgt.backend.invoices.database.InvoiceDatabase.TABLE;
@Repository
public class InvoiceRepository {
    private final SchemaRepository rows;
    public InvoiceRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public Invoice findById(Long id) { return Invoice.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
