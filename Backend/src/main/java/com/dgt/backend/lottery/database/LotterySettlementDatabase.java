package com.dgt.backend.lottery.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class LotterySettlementDatabase {
    private LotterySettlementDatabase() {}
    public static final Table TABLE = new Table("lottery_settlements","lottery_settlement_id","lottery",false,List.of(
        new Column("lottery_settlement_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("vendor_id","int8",false,false,false,0,64,0),
        new Column("settlement_reference","varchar",false,false,false,100,0,0),
        new Column("period_type","jsonb",false,false,false,0,0,0),
        new Column("period_start_date","date",false,false,false,0,0,0),
        new Column("period_end_date","date",false,false,false,0,0,0),
        new Column("total_sales","numeric",false,false,false,0,12,2),
        new Column("total_commission","numeric",false,false,false,0,12,2),
        new Column("status_type_id","int8",false,false,false,0,64,0),
        new Column("created_by","int8",false,false,false,0,64,0),
        new Column("paid_at","timestamptz",true,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
