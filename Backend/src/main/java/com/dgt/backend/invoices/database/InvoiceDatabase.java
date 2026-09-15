package com.dgt.backend.invoices.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InvoiceDatabase {
    private InvoiceDatabase() {}
    public static final Table TABLE = new Table("invoices","invoice_id","invoices",false,List.of(
        new Column("invoice_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("vendor_id","int8",false,false,false,0,64,0),
        new Column("invoice_number","varchar",false,false,false,100,0,0),
        new Column("invoice_type","varchar",false,false,false,50,0,0),
        new Column("invoice_date","date",false,false,false,0,0,0),
        new Column("received_date","date",true,false,false,0,0,0),
        new Column("due_date","date",true,false,false,0,0,0),
        new Column("received_by","int8",false,false,false,0,64,0),
        new Column("approved_by","int8",true,false,false,0,64,0),
        new Column("approved_at","timestamptz",true,false,false,0,0,0),
        new Column("purchase_order_id","int8",true,false,false,0,64,0)));
}
