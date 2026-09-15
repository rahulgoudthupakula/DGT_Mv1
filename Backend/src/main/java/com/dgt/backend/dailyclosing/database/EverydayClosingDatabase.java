package com.dgt.backend.dailyclosing.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EverydayClosingDatabase {
    private EverydayClosingDatabase() {}
    public static final Table TABLE = new Table("everyday_closing","everyday_closing_id","dailyclosing",false,List.of(
        new Column("everyday_closing_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("opening_datetime","timestamptz",false,false,false,0,0,0),
        new Column("closing_datetime","timestamptz",false,false,false,0,0,0),
        new Column("total_gross_sales","numeric",false,true,false,0,12,2),
        new Column("total_discounts","numeric",false,true,false,0,12,2),
        new Column("total_tax","numeric",false,true,false,0,12,2),
        new Column("total_net_sales","numeric",false,true,false,0,12,2),
        new Column("total_refunds","numeric",false,true,false,0,12,2),
        new Column("expected_cash","numeric",false,true,false,0,12,2),
        new Column("actual_cash","numeric",false,true,false,0,12,2),
        new Column("cash_variance","numeric",false,true,false,0,12,2),
        new Column("total_deposits","numeric",false,true,false,0,12,2),
        new Column("closed_by","int8",false,false,false,0,64,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
