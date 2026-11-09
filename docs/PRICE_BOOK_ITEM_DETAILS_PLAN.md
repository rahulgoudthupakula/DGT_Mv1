# Add Item remaining fields — proposal

Status: withdrawn for revision following full-schema inspection; no database changes applied by this proposal.
Target: dgt_test only. Preserve the existing Add/Edit layout; add Vendor selection and Units per Case where needed.

## Database changes proposed

Six nullable columns on products (existing items remain unknown/blank until edited):

| Column | Type | Meaning |
|---|---|---|
| is_age_restricted | boolean | Age-verification flag; minimum age/POS enforcement is separate |
| reorder_level | numeric(12,3) | Low-stock threshold in individual sellable units |
| purchase_unit | varchar(10) | ITEM or CASE: which unit the entered purchase cost describes |
| units_per_case | integer | Positive case quantity; required for CASE |
| purchase_gross_cost | numeric(12,2) | Gross cost of selected purchase unit |
| purchase_discount | numeric(12,2) | Dollar discount for that purchase unit, not a percentage |

SQL: Backend/db/proposals/20260912_pricebook_item_details.sql. Nonnegative cost/threshold constraints, discount no greater than gross, positive case quantity. No new tables or inventory quantity changes.

## Existing fields reused

- Vendor selection: store-scoped vendors.vendor_id/vendor_name; reject foreign-store vendors.
- Link the selected vendor via product_vendors (product_id, vendor_id, dgt_id, is_primary). Preserve other vendor relationships.
- product_vendors.unit_type and unit_cost describe the selected purchase unit and its net cost. The new products fields hold the current catalog cost basis even if no vendor is selected. Existing inventory.cost remains unchanged.
- Retail remains product_store_prices.retail_price. Current stock remains read-only inventory.available_quantity.

## Proposed calculations

- Purchase net = gross minus discount.
- ITEM: item net = purchase net; derive case totals only when units per case is supplied.
- CASE: case net = purchase net; item gross, discount and net = corresponding case amount / units per case.
- Cost shown beside Retail = net cost per individual sellable item.
- Margin = (retail - item net) / retail * 100. Leave blank for missing cost or zero retail.
- Compute using decimal arithmetic on the backend; preserve precision during division and round displayed amounts. Editing one purchase basis recalculates derived values; do not save independently contradictory item and case totals.
- Retail-from-margin: retail = item net / (1 - margin/100); require margin below 100 and positive cost.
- Example: a 24-item case costs $24 with a $2.40 discount. Case net $21.60; item net $0.90; retail $1.50 gives margin 40%.
- These are editable catalog purchasing costs, not receipt costing, inventory valuation or realized profit.

## Validation and next steps

After approval: apply migration, implement frontend/backend mappings, test save/reopen, CASE/ITEM calculations, invalid discounts/quantities, vendor ownership and admin/manager permissions. Record exact changes and results in CHANGE_LOG.md.

Deferred integrations: price groups/promotional batch rules, inventory entry/adjustments and POS. Vendor creation will need an explicit flow (the last inspected test vendor list was empty); do not invent or silently insert suppliers.

## Full test-schema inspection correction

Read-only information_schema search across all public tables found existing product_vendors.unit_type/unit_cost/unit_of_measure and grocery_invoice_items.unit_type/case_pack_quantity/unit_cost/item_line_discount. Invoice fields describe individual received/invoiced lines and must not be overwritten as catalog defaults. Vendor contacts also contain volume_discount_value/type; promotions contain discount_value. Their semantics differ from item purchase discounts.

No matching age restriction or reorder-level column was found. The original six-column proposal is not approved for execution: reuse product_vendors purchase-unit/cost fields where appropriate and settle catalog-default versus invoice-history mappings before proposing the remaining additions. Vendor Management follows Add Item per user instruction.
