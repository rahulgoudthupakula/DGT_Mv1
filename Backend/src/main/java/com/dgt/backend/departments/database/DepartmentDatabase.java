package com.dgt.backend.departments.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class DepartmentDatabase {
    private DepartmentDatabase() {}
    public static final Table TABLE = new Table("departments","department_id","departments",true,List.of(
        new Column("department_id","int8",false,true,true,0,64,0),
        new Column("department_name","varchar",false,false,false,150,0,0),
        new Column("is_default","bool",false,true,false,0,0,0)));
}
