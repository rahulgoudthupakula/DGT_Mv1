package com.dgt.backend.lottery.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class LotteryPackInventoryDatabase {
    private LotteryPackInventoryDatabase() {}
    public static final Table TABLE = new Table("lottery_pack_inventory","lottery_pack_inventory_id","lottery",false,List.of(
        new Column("lottery_pack_inventory_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("shift_opened_by","int8",false,false,false,0,64,0),
        new Column("shift_opened_at","timestamptz",false,false,false,0,0,0),
        new Column("shift_closed_at","timestamptz",true,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
