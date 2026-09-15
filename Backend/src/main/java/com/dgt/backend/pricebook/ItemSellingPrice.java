package com.dgt.backend.pricebook;
/** Effective selling price for product p / regular price pr. No stored price is overwritten. */
public final class ItemSellingPrice {
 private ItemSellingPrice(){}
 public static final String MSRP="(SELECT l.msrp FROM grocery_invoice_items l JOIN invoices inv ON inv.invoice_id=l.invoice_id JOIN vendors v ON v.vendor_id=inv.vendor_id AND v.dgt_id=inv.dgt_id WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND inv.dgt_id=p.dgt_id AND inv.approved_at IS NOT NULL AND l.is_product_new ORDER BY COALESCE(inv.received_date,inv.invoice_date),l.grocery_invoice_item_id LIMIT 1)";
 public static final String INTERIM="CASE WHEN EXISTS(SELECT 1 FROM store_sub_departments sd WHERE sd.store_sub_department_id=p.store_sub_department_id AND sd.dgt_id=p.dgt_id AND sd.source_type='UNCLASSIFIED') THEN "+MSRP+" END";
 public static final String SQL="COALESCE((SELECT g.group_price FROM product_price_groups l JOIN price_groups g ON g.price_group_id=l.price_group_id AND g.dgt_id=l.dgt_id WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id AND l.is_active AND g.is_active),"+INTERIM+",pr.retail_price)";
}
