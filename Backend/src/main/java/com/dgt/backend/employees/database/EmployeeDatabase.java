package com.dgt.backend.employees.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EmployeeDatabase {
    private EmployeeDatabase() {}
    public static final Table TABLE = new Table("employees","employee_id","employees",true,List.of(
        new Column("employee_id","int8",false,true,true,0,64,0),
        new Column("hire_date","date",false,false,false,0,0,0),
        new Column("termination_date","date",true,false,false,0,0,0),
        new Column("employee_type","varchar",false,false,false,50,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("user_id","int8",false,false,false,0,64,0)));
}
