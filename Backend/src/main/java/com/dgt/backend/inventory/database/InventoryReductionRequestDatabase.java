package com.dgt.backend.inventory.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InventoryReductionRequestDatabase {
    private InventoryReductionRequestDatabase() {}
    public static final Table TABLE = new Table("inventory_reduction_requests","reduction_request_id","inventory",false,List.of(
        new Column("reduction_request_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("request_type","varchar",false,false,false,30,0,0),
        new Column("quantity","numeric",false,false,false,0,12,3),
        new Column("reason","varchar",false,false,false,255,0,0),
        new Column("status","varchar",false,true,false,30,0,0),
        new Column("notes","text",true,false,false,0,0,0),
        new Column("destination","varchar",true,false,false,150,0,0),
        new Column("requested_by","int8",false,false,false,0,64,0),
        new Column("rejection_reason","varchar",true,false,false,255,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
