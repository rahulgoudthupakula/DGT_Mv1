package com.dgt.backend.employees.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EmployeeScheduleDatabase {
    private EmployeeScheduleDatabase() {}
    public static final Table TABLE = new Table("employee_schedules","schedule_id","employees",true,List.of(
        new Column("schedule_id","int8",false,true,true,0,64,0),
        new Column("employee_id","int8",false,false,false,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("work_date","date",false,false,false,0,0,0),
        new Column("schedule_start","timestamptz",false,false,false,0,0,0),
        new Column("schedule_end","timestamptz",false,false,false,0,0,0),
        new Column("status","varchar",false,false,false,30,0,0),
        new Column("notes","varchar",true,false,false,500,0,0),
        new Column("created_by","int8",false,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
