package com.dgt.backend.products.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class ProductDatabase {
    private ProductDatabase() {}
    public static final Table TABLE = new Table("products","product_id","products",true,List.of(
        new Column("product_id","int8",false,true,true,0,64,0),
        new Column("store_sub_department_id","int8",false,false,false,0,64,0),
        new Column("product_name","varchar",false,false,false,200,0,0),
        new Column("product_sku","varchar",false,false,false,100,0,0),
        new Column("is_returnable","bool",false,true,false,0,0,0),
        new Column("brand_id","int8",true,false,false,0,64,0),
        new Column("unit_of_measure","varchar",true,false,false,50,0,0),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("is_taxable","bool",false,true,false,0,0,0),
        new Column("is_ebt","bool",false,true,false,0,0,0)));
}
