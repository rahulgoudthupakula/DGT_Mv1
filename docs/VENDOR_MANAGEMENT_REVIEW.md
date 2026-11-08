# Vendor Management review — 2026-09-12

Scope: review plus requested disabling of Vendor Type. No database writes or backend implementation in this review. Keep existing UI; stores separate by default. Finish review before proceeding.

## Confirmed requirements

- Vendor Type stays visible but disabled/blank in Add Vendor. New browser-local vendor entries no longer silently receive Grocery as type; old entries retained.
- Items link to a vendor by two paths: an invoice or manual Link Item selection from available items in the same store.
- Reuse one product_vendors association for each vendor/product pair; repeated invoices must not duplicate the association. A product can have multiple vendors.

## What the code currently does

| Area | Finding |
|---|---|
| Add/list vendors | VendorList uses global browser localStorage key vendors-data, seeded with samples; no selected-store key or Java request. IDs based on array length, not database IDs. |
| Vendor profile | VendorProfile uses separate name-keyed mock profiles/invoices/payments; unknown names produce V-UNK, N/A and zero totals. It does not read the newly added vendor's contact details. |
| Link Item | Button has no handler. Linked-items table reads mockVendorItems. |
| Summary cards | Total vendors from browser data; total items from mock array; average lead time hardcoded 2.5; renewal summary uses sample values. |
| Contracts/Pricing/Audit | Mock rows and local/default controls. Not connected to Java persistence. |
| Invoice/delivery path | AddDeliveryDialog lists vendors/items from static pricebookItems; selecting vendor restricts selection to items already assigned in that sample data. postDelivery writes Supabase grocery_deliveries/grocery_delivery_lines and adjusts stock by SKU, not the scoped Java invoice/product_vendors path. Cannot use this unchanged for store-separated invoice linking. |
| Page access | Vendor Management is not in Index connectedPage. Admin sees inert preview; other users get the unconnected-page message. Parent sync banner also remains, inconsistent with default separate-store scope. |

## Existing test database fields verified read-only

- vendors: vendor_id, vendor_name, email, phone_number, website_url, payment_terms, lead_time_days, is_active, timestamps, dgt_id.
- product_vendors: product_vendor_id, product_id, vendor_id, vendor_sku, unit_type, unit_of_measure, unit_cost, is_primary, timestamps, dgt_id.
- invoices: invoice_id, dgt_id, vendor_id, invoice_number, invoice_type, invoice_date, received_date, due_date, received_by, approved_by, approved_at, purchase_order_id.
- grocery_invoice_items: invoice_id/product_id, vendor_item_code, quantity, unit_type, case_pack_quantity, unit_cost, item_line_discount, item_line_total, is_product_new, timestamps.
- vendor_item_cost_history already has old/new cost, effective date, change_source, changed_by and vendor/product IDs.
- vendor_audit_log already has vendor/product/store IDs, action_type, details and cost_history_id.
- Despite its name, vendor_contacts holds contract terms/dates/volume discounts/return windows/documents, not a contact person's name or address.

## Gaps to resolve before schema changes

- Contact Name and Address are absent from the inspected vendor tables; do not map them to contract fields.
- Case Pack is on invoice lines but not product_vendors as a purchasing default. MOQ and vendor-item active status likewise have no corresponding inspected link column. Vendor lead time exists; per-item lead time needs an explicit override rule if desired.
- Last cost/average cost should be calculated from the agreed invoice/history source; confirm weighted versus simple average and normalize ITEM/CASE units first. Do not invent zero costs or use unnormalized case prices.
- Manual linking currently needs a unit cost because product_vendors.unit_cost is required. Decide whether manual selection asks for cost or supports unknown cost via a schema change.
- Invoice linking should be atomic and repeat-safe at an agreed event (recommended approved/posted invoice, not incomplete draft). Validate store ownership for invoice, vendor and product. Preserve invoice history; decide whether posting updates the current vendor cost automatically.
- Permissions for Vendor Management have not been explicitly settled. Price Book Items is admin/manager only, but do not silently reuse that as approval for new financial workflows.
- Purchases/balances/payments require invoice/payment integration before real totals can be shown. Blank unavailable values instead of fabricated totals.

## Proposed implementation order after review approval

1. Store-scoped Add/Edit/List/Profile using vendor IDs, preserving layout; real contact details; disable unimplemented areas.
2. Manual Link Item from the selected store's catalog, persisted in product_vendors and shown in the vendor's items list.
3. Connect approved/posted invoice linking to the same association, with original invoice line costs and audit history preserved. Include products not already linked to the vendor in invoice item selection.
4. Implement cost/history display and then contracts, pricing settings and payment summaries as their rules are confirmed.
5. Return to Add Item, reusing the settled vendor/product cost and unit mappings.

Validation planned: store isolation, same-name vendors in different stores, add/edit/reopen, duplicate linking, multiple vendors for one item, invoice/manual convergence and access enforcement. Current review only ran TypeScript for the Vendor Type change; no vendor integration is claimed working.

## Implementation update after user clarification

Vendor optional on Add Item. Invoice association only for detected new products; existing-product invoices must not create links. Core store-scoped vendor CRUD/manual linking now implemented in test; invoice new-only endpoint tested but legacy invoice screen remains disconnected. See CHANGE_LOG.md for endpoints, validation and deferred work. This supersedes earlier proposals to link all invoice items.
