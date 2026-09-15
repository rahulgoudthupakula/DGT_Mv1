package com.dgt.backend.vendors.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class VendorContactDatabase {
    private VendorContactDatabase() {}
    public static final Table TABLE = new Table("vendor_contacts","contact_id","vendors",false,List.of(
        new Column("contact_id","int8",false,false,true,0,64,0),
        new Column("vendor_id","int8",false,false,false,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("contract_number","varchar",true,false,false,100,0,0),
        new Column("start_date","date",true,false,false,0,0,0),
        new Column("end_date","date",true,false,false,0,0,0),
        new Column("volume_threshold","numeric",true,false,false,0,10,2),
        new Column("volume_discount_value","numeric",true,false,false,0,10,2),
        new Column("volume_discount_type","varchar",true,false,false,50,0,0),
        new Column("return_window_days","int4",true,false,false,0,32,0),
        new Column("status","varchar",true,false,false,50,0,0),
        new Column("document_url","varchar",true,false,false,500,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("force_end_date","date",true,false,false,0,0,0)));
}
