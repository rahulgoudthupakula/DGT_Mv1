package com.dgt.backend.inventory.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InventoryReturnDatabase {
    private InventoryReturnDatabase() {}
    public static final Table TABLE = new Table("inventory_returns","return_id","inventory",false,List.of(
        new Column("return_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("vendor_id","int8",false,false,false,0,64,0),
        new Column("return_type","varchar",false,false,false,30,0,0),
        new Column("reference_number","varchar",true,false,false,100,0,0),
        new Column("status","varchar",false,true,false,30,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
