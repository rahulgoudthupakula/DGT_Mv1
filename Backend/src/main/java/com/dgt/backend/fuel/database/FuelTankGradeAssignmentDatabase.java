package com.dgt.backend.fuel.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class FuelTankGradeAssignmentDatabase {
    private FuelTankGradeAssignmentDatabase() {}
    public static final Table TABLE = new Table("fuel_tank_grade_assignments","assignment_id","fuel",false,List.of(
        new Column("assignment_id","int8",false,true,true,0,64,0),
        new Column("tank_id","int8",false,false,false,0,64,0),
        new Column("fuel_grade_id","int8",false,false,false,0,64,0),
        new Column("effective_from","date",false,false,false,0,0,0),
        new Column("effective_to","date",true,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
