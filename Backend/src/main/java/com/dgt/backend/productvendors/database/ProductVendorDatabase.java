package com.dgt.backend.productvendors.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class ProductVendorDatabase {
    private ProductVendorDatabase() {}
    public static final Table TABLE = new Table("product_vendors","product_vendor_id","productvendors",true,List.of(
        new Column("product_vendor_id","int8",false,true,true,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("vendor_id","int8",false,false,false,0,64,0),
        new Column("vendor_sku","varchar",true,false,false,100,0,0),
        new Column("unit_type","varchar",true,false,false,50,0,0),
        new Column("unit_of_measure","varchar",true,false,false,50,0,0),
        new Column("unit_cost","numeric",false,false,false,0,12,2),
        new Column("is_primary","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
