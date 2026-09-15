package com.dgt.backend.identity.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class UserRoleDatabase {
    private UserRoleDatabase() {}
    public static final Table TABLE = new Table("user_roles","user_role_id","identity",false,List.of(
        new Column("user_role_id","int8",false,false,true,0,64,0),
        new Column("user_id","int8",false,false,false,0,64,0),
        new Column("role_type_id","int8",false,false,false,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
