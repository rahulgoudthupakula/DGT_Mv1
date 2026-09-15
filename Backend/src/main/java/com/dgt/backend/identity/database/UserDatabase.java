package com.dgt.backend.identity.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class UserDatabase {
    private UserDatabase() {}
    public static final Table TABLE = new Table("users","user_id","identity",false,List.of(
        new Column("user_id","int8",false,false,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("employee_id","varchar",false,false,false,50,0,0),
        new Column("first_name","varchar",false,false,false,100,0,0),
        new Column("last_name","varchar",false,false,false,100,0,0),
        new Column("email","varchar",false,false,false,255,0,0),
        new Column("password_hash","varchar",false,false,true,255,0,0),
        new Column("account_status","varchar",false,true,false,20,0,0),
        new Column("two_factor_authentication","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
