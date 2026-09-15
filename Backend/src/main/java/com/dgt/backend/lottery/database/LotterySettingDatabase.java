package com.dgt.backend.lottery.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class LotterySettingDatabase {
    private LotterySettingDatabase() {}
    public static final Table TABLE = new Table("lottery_settings","lottery_setting_id","lottery",true,List.of(
        new Column("lottery_setting_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("max_open_packs_per_game","int4",false,false,false,0,32,0),
        new Column("allow_partial_returns","bool",false,false,false,0,0,0),
        new Column("default_commission_per_pack","numeric",false,false,false,0,12,2),
        new Column("settlement_frequency","jsonb",false,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
