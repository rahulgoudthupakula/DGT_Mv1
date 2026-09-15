package com.dgt.backend.vendors.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class VendorPriceSettingDatabase {
    private VendorPriceSettingDatabase() {}
    public static final Table TABLE = new Table("vendor_price_settings","setting_id","vendors",false,List.of(
        new Column("setting_id","int8",false,false,true,0,64,0),
        new Column("dgt_id","varchar",false,false,false,50,0,0),
        new Column("price_change_alert_enabled","bool",false,false,false,0,0,0),
        new Column("alert_threshold_percentage","numeric",true,false,false,0,10,2),
        new Column("approval_required","bool",false,false,false,0,0,0),
        new Column("permission_id","int8",true,false,false,0,64,0),
        new Column("approval_threshold_percentage","numeric",true,false,false,0,10,2),
        new Column("auto_pick_preferred_vendor","bool",false,false,false,0,0,0),
        new Column("use_fallback_vendor","bool",false,false,false,0,0,0),
        new Column("consider_lead_time","bool",false,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
