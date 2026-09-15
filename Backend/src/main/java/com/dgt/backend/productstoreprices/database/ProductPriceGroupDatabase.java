package com.dgt.backend.productstoreprices.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class ProductPriceGroupDatabase {
    private ProductPriceGroupDatabase() {}
    public static final Table TABLE = new Table("product_price_groups","product_price_group_id","productstoreprices",true,List.of(
        new Column("product_price_group_id","int8",false,true,true,0,64,0),
        new Column("price_group_id","int8",false,false,false,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
