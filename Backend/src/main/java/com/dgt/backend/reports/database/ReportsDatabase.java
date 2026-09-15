package com.dgt.backend.reports.database;

public final class ReportsDatabase {
    private ReportsDatabase() {}
    public static final String SALES = "SELECT (sale_datetime AT TIME ZONE 'UTC')::date AS sale_date,count(*) AS transactions,sum(subtotal) AS subtotal,sum(tax_amount) AS tax_amount,sum(total_amount) AS total_amount FROM public.sales WHERE store_id=? AND sale_datetime>=? AND sale_datetime<? AND sale_status='COMPLETED' AND transaction_type='SALE' GROUP BY 1 ORDER BY 1";
    public static final String INVENTORY = "SELECT i.inventory_id,i.dgt_id,i.product_id,p.product_name,i.available_quantity,i.cost,i.return_cost FROM public.inventory i JOIN public.products p ON p.product_id=i.product_id WHERE i.dgt_id=? ORDER BY i.inventory_id LIMIT ? OFFSET ?";
}
