package com.dgt.backend.fuel.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class FuelTankDatabase {
    private FuelTankDatabase() {}
    public static final Table TABLE = new Table("fuel_tanks","tank_id","fuel",true,List.of(
        new Column("tank_id","int8",false,true,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("tank_number","varchar",false,false,false,50,0,0),
        new Column("tank_name","varchar",true,false,false,100,0,0),
        new Column("capacity_gallons","numeric",false,false,false,0,12,2),
        new Column("safe_fill_capacity","numeric",false,false,false,0,12,2),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
