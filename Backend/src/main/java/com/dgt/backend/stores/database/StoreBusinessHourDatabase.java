package com.dgt.backend.stores.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class StoreBusinessHourDatabase {
    private StoreBusinessHourDatabase() {}
    public static final Table TABLE = new Table("store_business_hours","business_hours_id","stores",true,List.of(
        new Column("business_hours_id","int8",false,false,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("day_of_week","varchar",false,false,false,10,0,0),
        new Column("open_time","time",true,false,false,0,0,0),
        new Column("close_time","time",true,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("status","varchar",false,true,false,20,0,0)));
}
