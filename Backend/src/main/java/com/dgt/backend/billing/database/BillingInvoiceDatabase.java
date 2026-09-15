package com.dgt.backend.billing.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class BillingInvoiceDatabase {
    private BillingInvoiceDatabase() {}
    public static final Table TABLE = new Table("billing_invoices","invoice_id","billing",false,List.of(
        new Column("invoice_id","int8",false,false,true,0,64,0),
        new Column("store_id","varchar",false,false,false,50,0,0),
        new Column("subscription_plan_id","int8",false,false,false,0,64,0),
        new Column("invoice_number","varchar",false,false,false,100,0,0),
        new Column("invoice_date","date",false,false,false,0,0,0),
        new Column("period_start","date",false,false,false,0,0,0),
        new Column("period_end","date",false,false,false,0,0,0),
        new Column("subtotal","numeric",false,false,false,0,10,2),
        new Column("tax_amount","numeric",false,false,false,0,10,2),
        new Column("total_amount","numeric",false,false,false,0,10,2),
        new Column("dgt_invoice_status","varchar",false,false,false,50,0,0),
        new Column("paid_at","timestamptz",true,false,false,0,0,0),
        new Column("invoice_document_url","varchar",true,false,false,500,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0)));
}
