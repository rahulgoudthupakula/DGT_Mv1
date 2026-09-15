package com.dgt.backend.vendors.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class VendorDatabase {
    private VendorDatabase() {}
    public static final Table TABLE = new Table("vendors","vendor_id","vendors",true,List.of(
        new Column("vendor_id","int8",false,false,true,0,64,0),
        new Column("vendor_name","varchar",false,false,false,150,0,0),
        new Column("email","varchar",true,false,false,255,0,0),
        new Column("phone_number","varchar",true,false,false,20,0,0),
        new Column("website_url","varchar",true,false,false,500,0,0),
        new Column("payment_terms","varchar",true,false,false,100,0,0),
        new Column("lead_time_days","int4",true,false,false,0,32,0),
        new Column("is_active","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
