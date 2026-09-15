package com.dgt.backend.inventory.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InventoryTransferDatabase {
    private InventoryTransferDatabase() {}
    public static final Table TABLE = new Table("inventory_transfers","transfer_id","inventory",false,List.of(
        new Column("transfer_id","int8",false,true,true,0,64,0),
        new Column("from_dgt_id","varchar",false,false,false,50,0,0),
        new Column("to_dgt_id","varchar",false,false,false,50,0,0),
        new Column("transfer_date","timestamptz",false,true,false,0,0,0),
        new Column("status","varchar",false,true,false,30,0,0),
        new Column("created_by","int8",false,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
