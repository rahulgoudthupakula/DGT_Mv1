package com.dgt.backend.inventory.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InventoryDatabase {
    private InventoryDatabase() {}
    public static final Table TABLE = new Table("inventory","inventory_id","inventory",false,List.of(
        new Column("inventory_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("available_quantity","numeric",false,true,false,0,12,3),
        new Column("cost","numeric",false,true,false,0,12,2),
        new Column("return_cost","numeric",false,true,false,0,12,2),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
