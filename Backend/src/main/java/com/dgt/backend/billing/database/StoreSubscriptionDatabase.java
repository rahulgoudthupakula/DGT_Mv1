package com.dgt.backend.billing.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class StoreSubscriptionDatabase {
    private StoreSubscriptionDatabase() {}
    public static final Table TABLE = new Table("store_subscriptions","subscription_id","billing",false,List.of(
        new Column("subscription_id","int8",false,false,true,0,64,0),
        new Column("store_id","varchar",false,false,false,50,0,0),
        new Column("subscription_plan_id","int8",false,false,false,0,64,0),
        new Column("subscription_status","varchar",false,false,false,50,0,0),
        new Column("start_date","date",false,false,false,0,0,0),
        new Column("current_period_start","date",false,false,false,0,0,0),
        new Column("current_period_end","date",false,false,false,0,0,0),
        new Column("next_billing_date","date",true,false,false,0,0,0),
        new Column("auto_renewal","bool",false,false,false,0,0,0),
        new Column("cancelled_at","timestamptz",true,false,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
