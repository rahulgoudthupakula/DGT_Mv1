package com.dgt.backend.invoices.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InvoiceDocumentDatabase {
    private InvoiceDocumentDatabase() {}
    public static final Table TABLE = new Table("invoice_documents","invoice_document_id","invoices",false,List.of(
        new Column("invoice_document_id","int8",false,true,true,0,64,0),
        new Column("invoice_id","int8",false,false,false,0,64,0),
        new Column("document_type","varchar",false,false,false,50,0,0),
        new Column("file_name","varchar",false,false,false,255,0,0),
        new Column("file_url","text",false,false,false,0,0,0),
        new Column("uploaded_by","int8",false,false,false,0,64,0),
        new Column("uploaded_at","timestamptz",false,true,false,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
