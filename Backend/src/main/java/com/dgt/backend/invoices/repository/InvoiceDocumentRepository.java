package com.dgt.backend.invoices.repository;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.dgt.backend.common.repository.SchemaRepository;
import com.dgt.backend.invoices.entity.InvoiceDocument;
import static com.dgt.backend.invoices.database.InvoiceDocumentDatabase.TABLE;
@Repository
public class InvoiceDocumentRepository {
    private final SchemaRepository rows;
    public InvoiceDocumentRepository(SchemaRepository rows) { this.rows=rows; }
    public Map<String,Object> list(int page,int size) { return rows.list(TABLE,page,size); }
    public InvoiceDocument findById(Long id) { return InvoiceDocument.fromRow(rows.get(TABLE,id)); }
    public Map<String,Object> create(Map<String,Object> values) { return rows.insert(TABLE,values); }
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { return rows.update(TABLE,id,values,expected); }
}
