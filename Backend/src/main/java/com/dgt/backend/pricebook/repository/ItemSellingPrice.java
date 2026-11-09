package com.dgt.backend.pricebook.repository;
/** Effective selling price for product p / regular price pr. No stored price is overwritten. */
// SQL fragments expect product alias p and regular-price alias pr in the enclosing query.
public final class ItemSellingPrice {
 private ItemSellingPrice(){}
 // Use the earliest approved new-product invoice line as the MSRP source.
 public static final String MSRP="(SELECT l.msrp FROM grocery_invoice_items l JOIN invoices inv ON inv.invoice_id=l.invoice_id JOIN vendors v ON v.vendor_id=inv.vendor_id AND v.dgt_id=inv.dgt_id WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND inv.dgt_id=p.dgt_id AND inv.approved_at IS NOT NULL AND l.is_product_new ORDER BY COALESCE(inv.received_date,inv.invoice_date),l.grocery_invoice_item_id LIMIT 1)";
 // Use invoice MSRP as an interim fallback only for unclassified products.
 public static final String INTERIM="CASE WHEN EXISTS(SELECT 1 FROM store_sub_departments sd WHERE sd.store_sub_department_id=p.store_sub_department_id AND sd.dgt_id=p.dgt_id AND sd.source_type='UNCLASSIFIED') THEN "+MSRP+" END";
 // Choose an active group price first, then interim MSRP, then regular retail price.
 public static final String SQL="COALESCE((SELECT g.group_price FROM product_price_groups l JOIN price_groups g ON g.price_group_id=l.price_group_id AND g.dgt_id=l.dgt_id WHERE l.archived_at IS NULL AND l.product_id=p.product_id AND l.dgt_id=p.dgt_id AND l.is_active AND g.is_active),"+INTERIM+",pr.retail_price)";
}
