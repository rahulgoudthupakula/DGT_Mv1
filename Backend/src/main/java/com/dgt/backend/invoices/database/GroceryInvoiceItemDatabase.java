package com.dgt.backend.invoices.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class GroceryInvoiceItemDatabase {
    private GroceryInvoiceItemDatabase() {}
    public static final Table TABLE = new Table("grocery_invoice_items","grocery_invoice_item_id","invoices",false,List.of(
        new Column("grocery_invoice_item_id","int8",false,true,true,0,64,0),
        new Column("invoice_id","int8",false,false,false,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("vendor_item_code","varchar",true,false,false,100,0,0),
        new Column("quantity","numeric",false,false,false,0,12,3),
        new Column("unit_type","varchar",false,false,false,50,0,0),
        new Column("case_pack_quantity","numeric",true,false,false,0,12,3),
        new Column("msrp","numeric",true,false,false,0,12,2),
        new Column("unit_cost","numeric",false,false,false,0,12,2),
        new Column("item_line_discount","numeric",false,true,false,0,12,2),
        new Column("item_line_total","numeric",false,false,false,0,12,2),
        new Column("is_product_new","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
