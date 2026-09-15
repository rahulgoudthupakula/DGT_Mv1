package com.dgt.backend.invoices.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InvoiceAdjustmentDatabase {
    private InvoiceAdjustmentDatabase() {}
    public static final Table TABLE = new Table("invoice_adjustments","invoice_adjustment_id","invoices",false,List.of(
        new Column("invoice_adjustment_id","int8",false,true,true,0,64,0),
        new Column("invoice_id","int8",false,false,false,0,64,0),
        new Column("adjustment_type","varchar",false,false,false,50,0,0),
        new Column("adjusted_amount","numeric",false,false,false,0,12,2),
        new Column("reason","varchar",true,false,false,500,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
