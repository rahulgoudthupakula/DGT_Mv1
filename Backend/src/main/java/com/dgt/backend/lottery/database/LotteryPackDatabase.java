package com.dgt.backend.lottery.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class LotteryPackDatabase {
    private LotteryPackDatabase() {}
    public static final Table TABLE = new Table("lottery_packs","lottery_pack_id","lottery",false,List.of(
        new Column("lottery_pack_id","int8",false,true,true,0,64,0),
        new Column("invoice_id","int8",true,false,false,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("vendor_id","int8",false,false,false,0,64,0),
        new Column("start_ticket_number","int4",false,false,false,0,32,0),
        new Column("end_ticket_number","int4",false,false,false,0,32,0),
        new Column("total_tickets","int4",false,false,false,0,32,0),
        new Column("status_id","int8",false,false,false,0,64,0),
        new Column("return_date","timestamptz",true,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("performed_by","int8",false,false,false,0,64,0)));
}
