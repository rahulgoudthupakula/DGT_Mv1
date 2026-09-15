package com.dgt.backend.identity.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class RoleTypeDatabase {
    private RoleTypeDatabase() {}
    public static final Table TABLE = new Table("role_types","role_type_id","identity",false,List.of(
        new Column("role_type_id","int8",false,false,true,0,64,0),
        new Column("role_type_name","varchar",false,false,false,100,0,0),
        new Column("description","varchar",true,false,false,255,0,0),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
