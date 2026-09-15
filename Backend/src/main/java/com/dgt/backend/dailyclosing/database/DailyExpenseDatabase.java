package com.dgt.backend.dailyclosing.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class DailyExpenseDatabase {
    private DailyExpenseDatabase() {}
    public static final Table TABLE = new Table("daily_expenses","expenses_id","dailyclosing",false,List.of(
        new Column("expenses_id","int8",false,true,true,0,64,0),
        new Column("everyday_closing_id","int8",false,false,false,0,64,0),
        new Column("expenses_date","date",false,false,false,0,0,0),
        new Column("expenses_type","varchar",false,false,false,100,0,0),
        new Column("description","varchar",true,false,false,500,0,0),
        new Column("amount","numeric",false,false,false,0,12,2),
        new Column("paid_by","int8",false,false,false,0,64,0),
        new Column("receipt_number","varchar",true,false,false,100,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
