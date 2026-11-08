# Promotions review — 2026-09-12

Inspection only; no application or database changes applied.

## Current page

Frontend/src/components/pricebook/PromotionsPage.tsx preserves the existing table, summary cards, Create/View/Edit/Delete dialogs. Four types: % Discount, Fixed Price, Buy X Get Y, Bundle.

- Reads sample pricebookItems and browser localStorage key promotions-data, shared across stores.
- Product associations use names instead of stable product IDs.
- Create hardcodes Active; status is not derived from dates or store timezone.
- Edit/Create validation does not consistently require dates/order; generated IDs depend on list length and can repeat after deletion.
- UI stores discount rules as display strings instead of structured numeric fields.
- Index navigation has not connected Promotions to store access and still includes a parent/child sync banner. Default remains store-independent per user instructions.

## Verified dgt_test schema

- promotions: promotion_id, dgt_id, promotion_name, promotion_type, start_date/end_date (timestamptz), status, discount_value numeric(12,2), timestamps.
- promotion_products: promotion_product_id, promotion_id, product_id, timestamps; unique(promotion_id,product_id).
- Dates constrained end>=start; discount nonnegative. Each link has independent promotion/product FKs, but no composite constraint preventing cross-store product links.
- No Buy X/Get Y quantity or per-product bundle quantity fields.
- Generic backend controllers/services/repositories exist, but current page does not call them; dedicated store-scoped validated flow needed.

## Proposed implementation

- Preserve UI. Read only current store's actual items, save product IDs and structured rules, use existing admin/manager Price Book access.
- Connect Create/View/Edit and agreed remove/deactivate behavior; version/idempotency protection and audit records.
- % Discount: percentage per eligible item. Fixed Price: promotional selling price per eligible item (confirm label wording if needed).
- Date range uses store-local day boundaries; calculate Upcoming/Active/Expired. Treat end date as inclusive through store-local end of day.
- Prepare migration for confirmed quantity rules and same-store ownership constraints; ask before applying it to test.
- Do not import browser mock promotions into DB. Production release follows test verification and user authorization.

## Questions before quantity-rule implementation

1. Buy X Get Y: same item only, or mix-and-match selected items? If mixed, which item is free (e.g. cheapest eligible item)?
2. Bundle: one of each selected item, or configurable quantity for each item?
3. Removal: deactivate/cancel to retain history, or allow permanent deletion of unused promotions?

## Deferred POS rules

Actual checkout discount execution, overlaps/stacking, maximum applications, tax/returns interactions and POS synchronization are separate from managing promotion records. Do not claim these execute merely because a promotion is saved.

## Implementation update — 2026-09-12

User confirmed mix-and-match Buy/Get, bundle quantities default1/editable, and deactivation. Implemented in dgt_test/5173; see CHANGE_LOG.md for the approved migration and 41-test verification. Original inspection findings above describe the replaced implementation. Product IDs now used; sample/localStorage persistence no longer used by the page. POS execution rules remain deferred as listed above.
