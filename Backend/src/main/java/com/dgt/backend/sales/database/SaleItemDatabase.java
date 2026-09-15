package com.dgt.backend.sales.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class SaleItemDatabase {
    private SaleItemDatabase() {}
    public static final Table TABLE = new Table("sales_items","sales_item_id","sales",false,List.of(
        new Column("sales_item_id","int8",false,false,true,0,64,0),
        new Column("sale_id","int8",false,false,false,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("quantity","numeric",false,false,false,0,12,3),
        new Column("catalog_price","numeric",false,true,false,0,14,2),
        new Column("unit_price","numeric",false,true,false,0,14,2),
        new Column("gross_amount","numeric",false,true,false,0,14,2),
        new Column("discount_amount","numeric",false,true,false,0,14,2),
        new Column("taxable_amount","numeric",false,true,false,0,14,2),
        new Column("tax_amount","numeric",false,true,false,0,14,2),
        new Column("line_total","numeric",false,true,false,0,14,2),
        new Column("created_at","timestamptz",false,true,true,0,0,0)));
}
