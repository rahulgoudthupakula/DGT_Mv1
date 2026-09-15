package com.dgt.backend.sales.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class PosTerminalDatabase {
    private PosTerminalDatabase() {}
    public static final Table TABLE = new Table("pos_terminals","terminal_id","sales",true,List.of(
        new Column("terminal_id","int8",false,false,true,0,64,0),
        new Column("store_id","varchar",false,false,false,0,0,0),
        new Column("terminal_code","varchar",false,false,false,50,0,0),
        new Column("terminal_name","varchar",true,false,false,100,0,0),
        new Column("terminal_status","varchar",false,true,false,20,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
