package com.dgt.backend.fuel.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class FuelPriceDatabase {
    private FuelPriceDatabase() {}
    public static final Table TABLE = new Table("fuel_prices","fuel_price_id","fuel",false,List.of(
        new Column("fuel_price_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("fuel_grade_id","int8",false,false,false,0,64,0),
        new Column("cash_price","numeric",false,false,false,0,10,3),
        new Column("credit_price","numeric",false,false,false,0,10,3),
        new Column("effective_from","timestamptz",false,false,false,0,0,0),
        new Column("effective_to","timestamptz",true,false,false,0,0,0),
        new Column("changed_by","int8",false,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
