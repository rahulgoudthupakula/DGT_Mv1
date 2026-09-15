package com.dgt.backend.sales.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class SalePaymentDatabase {
    private SalePaymentDatabase() {}
    public static final Table TABLE = new Table("sale_payments","sale_payment_id","sales",false,List.of(
        new Column("sale_payment_id","int8",false,false,true,0,64,0),
        new Column("sale_id","int8",false,false,false,0,64,0),
        new Column("tender_type_id","int8",false,false,false,0,64,0),
        new Column("payment_amount","numeric",false,false,false,0,14,2),
        new Column("payment_status","varchar",false,false,false,20,0,0),
        new Column("card_brand","varchar",true,false,false,50,0,0),
        new Column("card_last4","varchar",true,false,false,4,0,0),
        new Column("processor_reference","varchar",true,false,false,255,0,0),
        new Column("authorization_code","varchar",true,false,false,100,0,0),
        new Column("payment_datetime","timestamptz",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
