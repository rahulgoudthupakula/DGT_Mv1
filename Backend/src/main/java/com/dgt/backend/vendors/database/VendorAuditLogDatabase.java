package com.dgt.backend.vendors.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class VendorAuditLogDatabase {
    private VendorAuditLogDatabase() {}
    public static final Table TABLE = new Table("vendor_audit_log","audit_id","vendors",false,List.of(
        new Column("audit_id","int8",false,false,true,0,64,0),
        new Column("vendor_id","int8",false,false,false,0,64,0),
        new Column("product_id","int8",true,false,false,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("action_type","varchar",true,false,false,100,0,0),
        new Column("details","varchar",true,false,false,500,0,0),
        new Column("cost_history_id","int8",true,false,false,0,64,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0)));
}
