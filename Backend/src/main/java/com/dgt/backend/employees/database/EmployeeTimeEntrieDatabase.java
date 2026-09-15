package com.dgt.backend.employees.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EmployeeTimeEntrieDatabase {
    private EmployeeTimeEntrieDatabase() {}
    public static final Table TABLE = new Table("employee_time_entries","time_entry_id","employees",false,List.of(
        new Column("time_entry_id","int8",false,true,true,0,64,0),
        new Column("employee_id","int8",false,false,false,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("clock_in","timestamptz",false,false,false,0,0,0),
        new Column("clock_out","timestamptz",true,false,false,0,0,0),
        new Column("regular_hours","numeric",false,true,false,0,8,2),
        new Column("overtime_hours","numeric",false,true,false,0,8,2),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("event_type","varchar",false,false,false,50,0,0)));
}
