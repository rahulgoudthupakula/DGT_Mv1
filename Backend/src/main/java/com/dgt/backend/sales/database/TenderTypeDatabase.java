package com.dgt.backend.sales.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class TenderTypeDatabase {
    private TenderTypeDatabase() {}
    public static final Table TABLE = new Table("tender_types","tender_type_id","sales",true,List.of(
        new Column("tender_type_id","int8",false,false,true,0,64,0),
        new Column("tender_code","varchar",false,false,false,50,0,0),
        new Column("tender_name","varchar",false,false,false,100,0,0),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
