package com.dgt.backend.fuel.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class FuelPumpDatabase {
    private FuelPumpDatabase() {}
    public static final Table TABLE = new Table("fuel_pumps","pump_id","fuel",true,List.of(
        new Column("pump_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("pump_number","varchar",false,false,false,50,0,0),
        new Column("status","varchar",false,false,false,20,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("serial_number","varchar",false,false,false,100,0,0)));
}
