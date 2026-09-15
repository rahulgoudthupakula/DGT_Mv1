package com.dgt.backend.productstoreprices.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class PriceGroupDatabase {
    private PriceGroupDatabase() {}
    public static final Table TABLE = new Table("price_groups","price_group_id","productstoreprices",true,List.of(
        new Column("price_group_id","int8",false,true,true,0,64,0),
        new Column("price_group_name","varchar",false,false,false,150,0,0),
        new Column("description","varchar",true,false,false,500,0,0),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("group_price","numeric",false,false,false,0,12,2),
        new Column("dgt_id","varchar",false,false,false,50,0,0)));
}
