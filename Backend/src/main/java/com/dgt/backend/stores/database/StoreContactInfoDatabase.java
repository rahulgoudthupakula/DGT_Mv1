package com.dgt.backend.stores.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class StoreContactInfoDatabase {
    private StoreContactInfoDatabase() {}
    public static final Table TABLE = new Table("store_contact_info","contact_info_id","stores",true,List.of(
        new Column("contact_info_id","int8",false,false,true,0,64,0),
        new Column("phone_number","varchar",true,false,false,20,0,0),
        new Column("email","varchar",true,false,false,255,0,0),
        new Column("address","varchar",false,false,false,500,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("dgt_id","varchar",true,false,false,50,0,0),
        new Column("store_name","varchar",true,false,false,150,0,0)));
}
