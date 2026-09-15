package com.dgt.backend.employees.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EmployeeStatusHistoryDatabase {
    private EmployeeStatusHistoryDatabase() {}
    public static final Table TABLE = new Table("employee_status_history","status_history_id","employees",false,List.of(
        new Column("status_history_id","int8",false,true,true,0,64,0),
        new Column("employee_id","int8",false,false,false,0,64,0),
        new Column("status","varchar",false,false,false,50,0,0),
        new Column("status_type_id","int8",false,false,false,0,64,0)));
}
