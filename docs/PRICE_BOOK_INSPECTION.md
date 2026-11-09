# Price Book inspection — 2026-09-11

Scope: source inspection only. No Price Book UI/API/database changes applied. Keep the existing UI when connecting features; test with Store1/Store2 in dgt_test before a separate real release.

## Current state

- Index.tsx does not include Price Book in connectedPage. Admins receive an inert, disabled layout preview; non-admins receive the unconnected-permissions message.
- ItemsPage.tsx: hardcoded mockItems; department/vendor/price-group lists are local. Stock hook reads Supabase item_stock. Clone, Send to POS and Delete contain empty handlers. This is not a real dgt item editor.
- PricebookStatisticsPage.tsx: generated sample/random chart data.
- BulkUpdatePage.tsx and PriceGroupsPage.tsx: local React state/sample catalog; changes are not persisted to the Java backend.
- PromotionsPage.tsx: sample entries/browser localStorage.
- NewArrivalsPage.tsx: Supabase item_stock/grocery_delivery_lines/grocery_deliveries plus browser-local assignments. Not the real dgt data pipeline.
- Generated product, barcode, vendor, inventory, pricing, price-group and promotion Java layers exist. Generic routes are denied by current SecurityConfig/AccessPolicy; they must not simply be exposed without company/store scoping and permission enforcement.

## Items field mapping from current Java models

| UI field | Existing model/source candidate |
|---|---|
| Name / SKU / active | products.product_name / product_sku / is_active |
| Returnable / taxable / EBT | products.is_returnable / is_taxable / is_ebt |
| Barcode | product_barcodes.product_barcode_value, product_barcode_type, is_primary |
| Department/subdepartment | products.store_sub_department_id and department relationships; validate ownership/default-vs-store rules |
| Vendor / unit cost | product_vendors.vendor_id, unit_cost, unit_type, unit_of_measure, is_primary |
| Retail price | product_store_prices.dgt_id + product_id + retail_price |
| On hand | inventory.dgt_id + product_id + available_quantity |
| Price group | price_groups / product_price_groups; inspect ownership and pricing precedence before wiring |

These are source mappings, not a fresh database compatibility assertion. Fields such as age restriction, reorder threshold, item/case gross/net/discount breakdown and promotional batch still need field/rule mapping. Unimplemented values should remain blank rather than fabricated.

## Implementation order

1. Items: confirm catalog ownership; inspect current test schema/data and map fields; connect store-scoped list/search/filter plus Add/Edit/Active controls to existing UI. Read inventory through its own records rather than silently overwriting stock from price edits.
2. Price Groups and Bulk Update: price precedence, effective timing and approval rules; version checks and transactional changes.
3. Promotions: dates, eligible products, discounts and POS application rules.
4. Inventory by Item, New Arrivals and Statistics: connect real inventory/delivery/sales sources as those workflows become available.
5. Leave Send to POS and POS-dependent calculations unavailable until POS is implemented.

## Decisions needed before writing data

- Catalog ownership: store-specific products or company-shared products with store-specific prices/stock? Product presently references a store subdepartment, so this affects relationships and scope.
- Which cost should the Items list use (primary vendor's unit cost, latest delivery cost or inventory cost)? How many units per case, and how do item/case discounts relate?
- Confirm product deactivation versus deletion and whether to reuse the existing cashier/accountant approval workflow for catalog/price changes.
- Confirm price-group overrides and promotion precedence when implementing those pages, rather than inventing pricing rules.

No production changes or deployments during inspection.
