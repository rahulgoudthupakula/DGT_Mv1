package com.dgt.backend.lottery.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class LotteryGameDatabase {
    private LotteryGameDatabase() {}
    public static final Table TABLE = new Table("lottery_games","lottery_game_id","lottery",true,List.of(
        new Column("lottery_game_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("game_code","varchar",false,false,false,50,0,0),
        new Column("game_name","varchar",false,false,false,150,0,0),
        new Column("ticket_price","numeric",false,false,false,0,10,2),
        new Column("tickets_per_pack","int4",false,false,false,0,32,0),
        new Column("pack_value","numeric",false,false,false,0,12,2),
        new Column("commission_percent","numeric",false,false,false,0,5,2),
        new Column("status","varchar",false,false,false,30,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("pack_number","varchar",true,false,false,50,0,0),
        new Column("barcode","varchar",true,false,false,100,0,0)));
}
