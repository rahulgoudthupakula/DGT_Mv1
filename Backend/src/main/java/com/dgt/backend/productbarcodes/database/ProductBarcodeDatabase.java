package com.dgt.backend.productbarcodes.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class ProductBarcodeDatabase {
    private ProductBarcodeDatabase() {}
    public static final Table TABLE = new Table("product_barcodes","product_barcode_id","productbarcodes",true,List.of(
        new Column("product_barcode_id","int8",false,true,true,0,64,0),
        new Column("product_id","int8",false,false,false,0,64,0),
        new Column("product_barcode_type","varchar",false,false,false,20,0,0),
        new Column("product_barcode_value","varchar",false,false,false,50,0,0),
        new Column("is_primary","bool",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
