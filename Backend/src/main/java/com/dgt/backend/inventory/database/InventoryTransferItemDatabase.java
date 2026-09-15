package com.dgt.backend.inventory.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InventoryTransferItemDatabase {
    private InventoryTransferItemDatabase() {}
    public static final Table TABLE = new Table("inventory_transfer_items","transfer_item_id","inventory",false,List.of(
        new Column("transfer_item_id","int8",false,true,true,0,64,0),
        new Column("transfer_id","int8",false,false,false,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("qty_sent","numeric",false,false,false,0,12,3),
        new Column("qty_received","numeric",false,true,false,0,12,3),
        new Column("unit_cost","numeric",false,false,false,0,12,2)));
}
