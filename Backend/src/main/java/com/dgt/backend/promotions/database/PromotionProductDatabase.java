package com.dgt.backend.promotions.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class PromotionProductDatabase {
    private PromotionProductDatabase() {}
    public static final Table TABLE = new Table("promotion_products","promotion_product_id","promotions",true,List.of(
        new Column("promotion_product_id","int8",false,true,true,0,64,0),
        new Column("promotion_id","int8",false,false,false,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
