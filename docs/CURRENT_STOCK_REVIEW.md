# Current Stock review — 2026-09-12

## Shared page
Price Book → Inventory by item (current stock) and Inventory Valuation → Current stock both use InventoryByItem.tsx, InventoryByItemTable.tsx and InventoryByItemDrawer.tsx. Current stock adds a heading; one shared implementation can serve both. The separate Inventory Valuation → Valuation tab is a different report.

## Current gaps
- Ten hardcoded products, quantities, values, purchase histories, movements and risk statuses; no backend/store props or live queries.
- Both routes remain outside connectedPage: admin layout preview, actions disabled; non-admin unfinished-page guard.
- Date, store, vendor and valuation-method selections are unused by filtering/calculation. Department filters sample category names; category/subdepartment mapping needs correction. Risk filtering uses sample status, with Slow-moving standing in for zero sales.
- No real expiry/stock-age/zero-sales computation. Stock age over45 only colors text; it is not an implemented risk rule.
- Drawer cost trend uses an unweighted mean of sample purchase costs; it is not inventory weighted-average costing. Empty history causes NaN/Infinity. Summary divides by total quantity without a zero-quantity guard.

## Existing data inspected
- inventory: store/product keys, available_quantity, cost, return_cost, timestamps; same-store product FK and unique store/product. Negative quantity is prohibited, so Negative Stock cannot currently occur through valid writes.
- inventory_movements: store/product, movement_type, qty_changed, unit_cost, reference_id and timestamps. No composite same-store FK here yet. Existing Items count edits generate ADJUSTMENT movements but do not recalculate inventory.cost.
- No public table names matching valuation or batch were found. Do not treat inventory.cost or current catalog cost as verified weighted-average inventory cost without a defined costing workflow.
- Generic inventory API is closed by AccessPolicy. Existing scoped Items API already reads inventory counts and catalog costs.

## Proposed next implementation
- Keep both menu entries and existing UI, backed by one store-scoped read workflow. Use selected store, real item/SKU, department/subdepartment, vendor links, current inventory quantity and available movement records.
- Make department/vendor filters functional with no duplicate item rows for multiple vendors. Use consistent access policy for both entry points; confirm intended Inventory Valuation role access.
- Keep unsupported values blank and controls disabled: historical as-of stock until complete opening balances/movement history; expiry/age/slow-sales until receipt batches/POS rules are available.
- Define average-cost valuation versus last-purchase valuation before enabling those calculations. Catalog cost is a distinct field and should not be relabelled average cost. Normalize invoice case quantities/costs before any purchase comparisons.
- Connect real approved invoice purchase history when its posting/inventory rules are ready; no fabricated purchase rows or risk totals.

Inspection only. No inventory implementation or schema mutations performed.

## Test implementation update
Shared current-stock list, filters and recorded movements implemented on 2026-09-12. Earlier gaps above describe inspection state; costing/purchases/history/risk rules remain deferred. See CHANGE_LOG.md for exact scope.
