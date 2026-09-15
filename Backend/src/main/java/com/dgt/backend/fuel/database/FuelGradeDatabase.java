package com.dgt.backend.fuel.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class FuelGradeDatabase {
    private FuelGradeDatabase() {}
    public static final Table TABLE = new Table("fuel_grades","fuel_grade_id","fuel",true,List.of(
        new Column("fuel_grade_id","int8",false,true,true,0,64,0),
        new Column("fuel_type","varchar",false,false,false,50,0,0),
        new Column("grade_name","varchar",false,false,false,100,0,0),
        new Column("octane_rating","numeric",false,false,false,0,5,2),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
