# Bulk Update inspection — 2026-09-12

Inspection only; implementation pending.

- BulkUpdatePage.tsx uses seven hardcoded items. Save Changes copies draft into React state; reload discards edits. No Java bulk-write endpoint is called.
- useItemStock reads legacy Supabase item_stock by SKU with no selected-store filter in this hook. Replace with the existing store-scoped Java inventory data; do not mix sources.
- Edit enables every row, regardless of checkbox selection. Checkboxes only affect highlighting and page selection. Rows are keyed/updated by barcode rather than product ID.
- Import CSV has no handler. Parent-sync banner is still shown; separate-store default must apply.
- Department/vendor/price-group/promo options come from samples. Department edits do not update/validate subdepartment. Vendor and group relationships cannot safely be replaced with label strings.
- Cost, gross, discount, net and case fields can all be independently changed, so they become inconsistent. Only margin auto-recalculates. No case-pack quantity field exists here. Clearing numeric inputs immediately forces zero; stock/reorder edits truncate fractional values. Supabase quantity can override edited draft quantity on display.
- No validation, concurrency handling, approval submission, persistent audit or cost-history writes.

Recommended implementation preserving layout:
1. Load current-store Items data, real departments, vendor names and price-group names; identify rows by product ID.
2. Retain Edit / Save Changes / Cancel. Save only changed records with version checks, validate the whole batch and commit atomically; use existing admin/manager and approval rules.
3. Reuse Items cost calculations and history, inventory count adjustments, fractional quantities and group-price protection. Derived net/case/margin values should calculate consistently rather than accept conflicting values.
4. Keep vendor/group relationships read-only initially; manage them on their existing pages. Keep promotional batch blank/disabled unless its relationship is defined. Connect Export CSV to real store items; no import workflow requested.
5. Clarify selected-row behavior before implementing mass field assignment; current page is a multi-row editor, not a selected-items shared-value tool.

No database changes proposed yet; existing Items tables cover most fields.

## Confirmed correction
- User wants Export CSV, not Import. Button label/icon corrected; export remains disabled until connected to real items, avoiding export of samples. CSV import is out of scope.
- Bulk Update and Items must read/write the same item records and existing related tables. Only the editing UI differs: Items uses a drawer, Bulk Update uses multiple table rows. Reuse existing Items validation, calculations, permissions, version checks, stock adjustments and cost history; do not create a separate bulk-item data store.
- Implementation should support exporting persisted current-store items using the active filters, once real data is connected.

## Implementation update
Connected in test on 2026-09-12; initial inspection above describes pre-implementation behavior. Same Items reads and save logic reused, table editing and export implemented. Extra column mappings and validation are recorded in CHANGE_LOG.md. No schema changes. Production release pending.

## Updated requirements implemented
All displayed fields are now editable in test, superseding earlier read-only relationship/calculated-field recommendations. Vendors support multiple selections; Promotional Batch assigns existing promotions. Derived cost edits resolve into canonical costs. Grouped items retain a separately saved individual price, effective upon leaving the group. See CHANGE_LOG.md for schema and validation.

## Latest pricing correction
Use existing regular retail and group_price columns only. Active membership resolves effective selling price without overwriting regular retail. The temporary individual_retail_price test column was removed. See CHANGE_LOG.md; this supersedes the prior separate-column design.
