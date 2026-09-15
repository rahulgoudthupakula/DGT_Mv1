package com.dgt.backend.employees.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EmployeeCompensationDatabase {
    private EmployeeCompensationDatabase() {}
    public static final Table TABLE = new Table("employee_compensation","compensation_id","employees",true,List.of(
        new Column("compensation_id","int8",false,true,true,0,64,0),
        new Column("employee_id","int8",false,false,false,0,64,0),
        new Column("pay_type","varchar",false,false,false,30,0,0),
        new Column("hourly_rate","numeric",true,false,false,0,12,2),
        new Column("annual_salary","numeric",true,false,false,0,12,2),
        new Column("effective_from","date",false,false,false,0,0,0),
        new Column("effective_to","date",true,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
