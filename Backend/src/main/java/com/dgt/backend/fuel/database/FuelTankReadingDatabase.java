package com.dgt.backend.fuel.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class FuelTankReadingDatabase {
    private FuelTankReadingDatabase() {}
    public static final Table TABLE = new Table("fuel_tank_readings","tank_reading_id","fuel",false,List.of(
        new Column("tank_reading_id","int8",false,true,true,0,64,0),
        new Column("tank_id","int8",false,false,false,0,64,0),
        new Column("reading_datetime","timestamptz",false,false,false,0,0,0),
        new Column("volume_gallons","numeric",false,false,false,0,12,2),
        new Column("temperature","numeric",true,false,false,0,8,2),
        new Column("ullage","numeric",true,false,false,0,12,2),
        new Column("created_by","int8",false,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("image_url","text",true,false,false,0,0,0)));
}
