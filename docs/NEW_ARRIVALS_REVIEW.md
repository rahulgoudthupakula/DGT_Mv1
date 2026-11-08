# New Arrivals review — 2026-09-12

- Current UI reads Supabase item_stock, grocery_delivery_lines and grocery_deliveries without a selected-store filter. It joins static pricebookItems and departmentTree data.
- Department/margin/retail assignments are stored only in localStorage, keyed by SKU, not persisted to the backend or isolated by store.
- The New label currently means created within seven days. First receipt currently uses stock creation time rather than verified invoice receipt time. Case cost conversion needs checking before calculating retail.
- A generic Java new_arrivals endpoint and table mapping exist, including invoice_item_id, department_id, store_sub_department_id, suggested_retail_price and status_id; this UI does not use them. Inspect live relationships before implementation.
- Next: connect selected-store data, actual department choices, validated persistent classification and pricing, and admin/manager Price Book access. Preserve the layout. Invoice posting integration must respect the previously agreed new-item-only vendor linking rule.
- Review only; no New Arrivals implementation or database change in this release.

## Test implementation update
The legacy UI data connection described above has now been replaced. The page uses store-scoped approved invoice lines flagged is_product_new and real Items data. Category/price confirmation uses the existing Items update/approval workflow. No localStorage assignments or default 30% margins remain. No schema changes were needed. The generic new_arrivals table is not used because its status semantics are undefined; pending classification follows the product UNCLASSIFIED subdepartment. Invoice workflow completion, optional status design and production release remain pending.
