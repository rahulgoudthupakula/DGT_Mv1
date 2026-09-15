package com.dgt.backend.lottery.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class LotteryPackInventoryItemDatabase {
    private LotteryPackInventoryItemDatabase() {}
    public static final Table TABLE = new Table("lottery_pack_inventory_items","lottery_pack_inventory_item_id","lottery",false,List.of(
        new Column("lottery_pack_inventory_item_id","int8",false,true,true,0,64,0),
        new Column("lottery_pack_inventory_id","int8",false,false,false,0,64,0),
        new Column("open_ticket_number","int4",false,false,false,0,32,0),
        new Column("last_sold_ticket_number","int4",true,false,false,0,32,0),
        new Column("physical_quantity","int4",false,false,false,0,32,0),
        new Column("pack_id","int8",false,false,false,0,64,0),
        new Column("commission_amount","numeric",true,false,false,0,12,2),
        new Column("expected_cash","numeric",true,false,false,0,12,2),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
