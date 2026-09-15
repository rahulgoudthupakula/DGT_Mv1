package com.dgt.backend.employees.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EmployeeEmergencyContactDatabase {
    private EmployeeEmergencyContactDatabase() {}
    public static final Table TABLE = new Table("employee_emergency_contacts","emergency_contact_id","employees",true,List.of(
        new Column("emergency_contact_id","int8",false,true,true,0,64,0),
        new Column("employee_id","int8",false,false,false,0,64,0),
        new Column("contact_name","varchar",false,false,false,150,0,0),
        new Column("relationship","varchar",false,false,false,50,0,0),
        new Column("phone","varchar",false,false,false,30,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
