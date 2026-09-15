package com.dgt.backend.dailyclosing.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class DailyClosingTenderDatabase {
    private DailyClosingTenderDatabase() {}
    public static final Table TABLE = new Table("daily_closing_tenders","tender_id","dailyclosing",false,List.of(
        new Column("tender_id","int8",false,true,true,0,64,0),
        new Column("everyday_closing_id","int8",false,false,false,0,64,0),
        new Column("tender_type","varchar",false,false,false,50,0,0),
        new Column("expected_amount","numeric",false,false,false,0,12,2),
        new Column("actual_amount","numeric",false,false,false,0,12,2),
        new Column("amount_difference","numeric",false,false,false,0,12,2),
        new Column("transaction_count","int4",false,false,false,0,32,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
