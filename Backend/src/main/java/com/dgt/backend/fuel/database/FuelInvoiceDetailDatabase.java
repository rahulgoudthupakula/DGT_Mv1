package com.dgt.backend.fuel.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class FuelInvoiceDetailDatabase {
    private FuelInvoiceDetailDatabase() {}
    public static final Table TABLE = new Table("fuel_invoice_details","fuel_invoice_details_id","fuel",false,List.of(
        new Column("fuel_invoice_details_id","int8",false,true,true,0,64,0),
        new Column("invoice_id","int8",false,false,false,0,64,0),
        new Column("delivery_number","varchar",true,false,false,100,0,0),
        new Column("bill_of_lading_number","varchar",true,false,false,100,0,0),
        new Column("carrier_name","varchar",true,false,false,150,0,0),
        new Column("delivery_date","date",false,false,false,0,0,0),
        new Column("total_gallons","numeric",false,false,false,0,12,3),
        new Column("fuel_subtotal","numeric",false,false,false,0,12,2),
        new Column("freight_amount","numeric",false,true,false,0,12,2),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
