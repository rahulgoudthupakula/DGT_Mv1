package com.dgt.backend.products.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class BrandDatabase {
    private BrandDatabase() {}
    public static final Table TABLE = new Table("brands","brand_id","products",true,List.of(
        new Column("brand_id","int8",false,true,true,0,64,0),
        new Column("brand_name","varchar",false,false,false,150,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0),
        new Column("description","varchar",true,false,false,500,0,0)));
}
