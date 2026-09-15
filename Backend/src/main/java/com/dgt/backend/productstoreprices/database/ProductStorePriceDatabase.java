package com.dgt.backend.productstoreprices.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class ProductStorePriceDatabase {
    private ProductStorePriceDatabase() {}
    public static final Table TABLE = new Table("product_store_prices","store_price_id","productstoreprices",true,List.of(
        new Column("store_price_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("retail_price","numeric",false,false,false,0,12,2),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("rebate_id","int8",true,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
