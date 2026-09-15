package com.dgt.backend.vendors.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class VendorItemCostHistoryDatabase {
    private VendorItemCostHistoryDatabase() {}
    public static final Table TABLE = new Table("vendor_item_cost_history","cost_history_id","vendors",false,List.of(
        new Column("cost_history_id","int8",false,false,true,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("vendor_id","int8",false,false,false,0,64,0),
        new Column("old_cost","numeric",true,false,false,0,10,2),
        new Column("new_cost","numeric",true,false,false,0,10,2),
        new Column("change_percentage","numeric",true,false,false,0,10,2),
        new Column("effective_date","date",true,false,false,0,0,0),
        new Column("change_source","varchar",true,false,false,100,0,0),
        new Column("changed_by","int8",true,false,false,0,64,0),
        new Column("created_date","timestamptz",false,true,true,0,0,0),
        new Column("updated_date","timestamptz",false,true,true,0,0,0)));
}
