package com.dgt.backend.products.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class NewArrivalDatabase {
    private NewArrivalDatabase() {}
    public static final Table TABLE = new Table("new_arrivals","new_arrivals_id","products",false,List.of(
        new Column("new_arrivals_id","int8",false,true,true,0,64,0),
        new Column("invoice_item_id","int8",false,false,false,0,64,0),
        new Column("product_name","varchar",false,false,false,200,0,0),
        new Column("department_id","int8",false,false,false,0,64,0),
        new Column("store_sub_department_id","int8",false,false,false,0,64,0),
        new Column("suggested_retail_price","numeric",true,false,false,0,12,2),
        new Column("status_id","int8",false,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
