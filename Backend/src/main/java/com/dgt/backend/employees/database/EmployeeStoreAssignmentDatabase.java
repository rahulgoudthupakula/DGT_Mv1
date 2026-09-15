package com.dgt.backend.employees.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EmployeeStoreAssignmentDatabase {
    private EmployeeStoreAssignmentDatabase() {}
    public static final Table TABLE = new Table("employee_store_assignments","employee_store_assignment_id","employees",true,List.of(
        new Column("employee_store_assignment_id","int8",false,true,true,0,64,0),
        new Column("employee_id","int8",false,false,false,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("is_primary","bool",false,true,false,0,0,0),
        new Column("effective_from","date",false,false,false,0,0,0),
        new Column("effective_to","date",true,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("role_type_id","int8",false,false,false,0,64,0)));
}
