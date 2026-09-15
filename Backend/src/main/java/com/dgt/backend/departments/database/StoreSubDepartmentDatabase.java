package com.dgt.backend.departments.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class StoreSubDepartmentDatabase {
    private StoreSubDepartmentDatabase() {}
    public static final Table TABLE = new Table("store_sub_departments","store_sub_department_id","departments",true,List.of(
        new Column("store_sub_department_id","int8",false,true,true,0,64,0),
        new Column("store_department_id","int8",false,false,false,0,64,0),
        new Column("store_sub_department_name","varchar",false,false,false,150,0,0),
        new Column("is_taxable","bool",false,true,false,0,0,0),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("source_type","varchar",false,true,false,20,0,0)));
}
