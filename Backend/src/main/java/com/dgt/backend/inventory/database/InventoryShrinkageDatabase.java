package com.dgt.backend.inventory.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InventoryShrinkageDatabase {
    private InventoryShrinkageDatabase() {}
    public static final Table TABLE = new Table("inventory_shrinkage","shrinkage_id","inventory",false,List.of(
        new Column("shrinkage_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("shrinkage_date","timestamptz",false,true,false,0,0,0),
        new Column("reason_type","varchar",false,false,false,50,0,0),
        new Column("created_by","int8",false,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
