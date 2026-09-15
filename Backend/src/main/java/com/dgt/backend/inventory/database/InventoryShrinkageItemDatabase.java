package com.dgt.backend.inventory.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InventoryShrinkageItemDatabase {
    private InventoryShrinkageItemDatabase() {}
    public static final Table TABLE = new Table("inventory_shrinkage_items","shrinkage_item_id","inventory",false,List.of(
        new Column("shrinkage_item_id","int8",false,true,true,0,64,0),
        new Column("shrinkage_id","int8",false,false,false,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("qty","numeric",false,false,false,0,12,3),
        new Column("unit_cost","numeric",false,false,false,0,12,2),
        new Column("loss_amount","numeric",false,false,false,0,12,2),
        new Column("reason","varchar",true,false,false,255,0,0)));
}
