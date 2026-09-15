package com.dgt.backend.promotions.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class PromotionDatabase {
    private PromotionDatabase() {}
    public static final Table TABLE = new Table("promotions","promotion_id","promotions",true,List.of(
        new Column("promotion_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("promotion_name","varchar",false,false,false,150,0,0),
        new Column("promotion_type","varchar",false,false,false,50,0,0),
        new Column("start_date","timestamptz",false,false,false,0,0,0),
        new Column("end_date","timestamptz",false,false,false,0,0,0),
        new Column("status","varchar",false,true,false,30,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("discount_value","numeric",true,false,false,0,12,2)));
}
