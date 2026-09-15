package com.dgt.backend.dailyclosing.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class DailyClosingDepositDatabase {
    private DailyClosingDepositDatabase() {}
    public static final Table TABLE = new Table("daily_closing_deposits","deposit_id","dailyclosing",false,List.of(
        new Column("deposit_id","int8",false,true,true,0,64,0),
        new Column("everyday_closing_id","int8",false,false,false,0,64,0),
        new Column("deposit_date","date",false,false,false,0,0,0),
        new Column("bank_account_id","int8",false,false,false,0,64,0),
        new Column("amount","numeric",false,false,false,0,12,2),
        new Column("receipt_url","text",true,false,false,0,0,0),
        new Column("deposited_by","int8",false,false,false,0,64,0),
        new Column("status","varchar",false,false,false,30,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
