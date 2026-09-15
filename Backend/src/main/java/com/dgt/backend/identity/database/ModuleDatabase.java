package com.dgt.backend.identity.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class ModuleDatabase {
    private ModuleDatabase() {}
    public static final Table TABLE = new Table("modules","module_id","identity",false,List.of(
        new Column("module_id","int8",false,false,true,0,64,0),
        new Column("module_name","varchar",false,false,false,100,0,0),
        new Column("submodule_name","varchar",true,false,false,100,0,0),
        new Column("description","varchar",true,false,false,255,0,0),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
