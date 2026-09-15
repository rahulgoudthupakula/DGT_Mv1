package com.dgt.backend.stores.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class StoreDatabase {
    private StoreDatabase() {}
    public static final Table TABLE = new Table("stores","dgt_id","stores",true,List.of(
        new Column("dgt_id","varchar",false,true,true,50,0,0),
        new Column("store_id","varchar",false,false,false,50,0,0),
        new Column("store_name","varchar",false,false,false,150,0,0),
        new Column("legal_business_name","varchar",false,false,false,200,0,0),
        new Column("tax_id","varchar",false,false,false,50,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("license_number","varchar",false,false,false,100,0,0),
        new Column("timezone","varchar",true,false,false,80,0,0),
        new Column("company_id","int8",true,false,true,0,64,0)));
}
