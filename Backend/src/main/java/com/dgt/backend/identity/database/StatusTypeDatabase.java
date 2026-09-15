package com.dgt.backend.identity.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class StatusTypeDatabase {
    private StatusTypeDatabase() {}
    public static final Table TABLE = new Table("status_types","status_type_id","identity",false,List.of(
        new Column("status_type_id","int8",false,true,true,0,64,0),
        new Column("status_name","varchar",false,false,false,50,0,0)));
}
