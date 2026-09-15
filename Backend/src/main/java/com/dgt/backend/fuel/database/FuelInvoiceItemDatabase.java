package com.dgt.backend.fuel.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class FuelInvoiceItemDatabase {
    private FuelInvoiceItemDatabase() {}
    public static final Table TABLE = new Table("fuel_invoice_items","fuel_invoice_item_id","fuel",false,List.of(
        new Column("fuel_invoice_item_id","int8",false,true,true,0,64,0),
        new Column("invoice_id","int8",false,false,false,0,64,0),
        new Column("fuel_grade_id","int8",false,false,false,0,64,0),
        new Column("gross_gallons","numeric",false,false,false,0,12,3),
        new Column("net_gallons","numeric",false,false,false,0,12,3),
        new Column("price_per_gallon","numeric",false,false,false,0,12,4),
        new Column("fuel_line_total","numeric",false,false,false,0,12,2),
        new Column("created_at","timestamptz",false,true,true,0,0,0)));
}
