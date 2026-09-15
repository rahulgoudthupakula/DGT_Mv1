package com.dgt.backend.inventorymovements.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InventoryMovementDatabase {
    private InventoryMovementDatabase() {}
    public static final Table TABLE = new Table("inventory_movements","movement_id","inventorymovements",false,List.of(
        new Column("movement_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("movement_type","varchar",false,false,false,30,0,0),
        new Column("qty_changed","numeric",false,false,false,0,12,3),
        new Column("unit_cost","numeric",false,true,false,0,12,2),
        new Column("reference_id","int8",true,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
