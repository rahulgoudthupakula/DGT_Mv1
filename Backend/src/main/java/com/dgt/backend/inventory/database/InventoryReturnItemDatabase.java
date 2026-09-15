package com.dgt.backend.inventory.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InventoryReturnItemDatabase {
    private InventoryReturnItemDatabase() {}
    public static final Table TABLE = new Table("inventory_return_items","return_item_id","inventory",false,List.of(
        new Column("return_item_id","int8",false,true,true,0,64,0),
        new Column("return_id","int8",false,false,false,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("qty","numeric",false,false,false,0,12,3),
        new Column("unit_cost","numeric",false,false,false,0,12,2),
        new Column("reason","varchar",true,false,false,255,0,0)));
}
