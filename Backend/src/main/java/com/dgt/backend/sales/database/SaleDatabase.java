package com.dgt.backend.sales.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class SaleDatabase {
    private SaleDatabase() {}
    public static final Table TABLE = new Table("sales","sale_id","sales",false,List.of(
        new Column("sale_id","int8",false,false,true,0,64,0),
        new Column("store_id","varchar",false,false,false,0,0,0),
        new Column("cashier_id","int8",false,false,false,0,64,0),
        new Column("terminal_id","int8",false,false,false,0,64,0),
        new Column("receipt_no","varchar",false,false,false,100,0,0),
        new Column("transaction_id","varchar",false,false,false,100,0,0),
        new Column("transaction_type","varchar",false,false,false,20,0,0),
        new Column("sale_status","varchar",false,false,false,20,0,0),
        new Column("sale_datetime","timestamptz",false,true,false,0,0,0),
        new Column("subtotal","numeric",false,true,false,0,14,2),
        new Column("taxable_amount","numeric",false,true,false,0,14,2),
        new Column("tax_amount","numeric",false,true,false,0,14,2),
        new Column("discount_amount","numeric",false,true,false,0,14,2),
        new Column("total_amount","numeric",false,true,false,0,14,2),
        new Column("total_items","int4",false,true,false,0,32,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
