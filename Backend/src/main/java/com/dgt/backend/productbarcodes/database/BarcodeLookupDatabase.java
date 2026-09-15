package com.dgt.backend.productbarcodes.database;

public final class BarcodeLookupDatabase {
    private BarcodeLookupDatabase() {}
    public static final String LOOKUP="SELECT p.product_id,p.product_sku,p.product_name,p.unit_of_measure,p.is_taxable,p.is_ebt,b.product_barcode_value,b.product_barcode_type,sp.retail_price,i.available_quantity FROM public.product_barcodes b JOIN public.products p ON p.product_id=b.product_id LEFT JOIN public.product_store_prices sp ON sp.product_id=p.product_id AND sp.dgt_id=? AND sp.is_active=true LEFT JOIN public.inventory i ON i.product_id=p.product_id AND i.dgt_id=? WHERE b.archived_at IS NULL AND b.product_barcode_value=? AND p.is_active=true";
}
