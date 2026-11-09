# Grocery Inventory Adjustment review — 2026-09-12

Scope: Grocery → Inventory adjustment → Inventory adjustment (StockAdjustments.tsx). Inspection only.

- Current items, departments, vendors, transfer destinations, costs, rebates and quantities are sample arrays. No selected-store backend reads.
- Single-row edits only update React state; refresh loses them. Reduction requests go to localStorage grocery_inventory_approvals, not backend approval_requests. No real stock update occurs.
- Existing backend mappings include inventory, inventory_movements, inventory_shrinkage / inventory_shrinkage_items and inventory_transfers / inventory_transfer_items. Existing Items count adjustments already record movements and support approvals; reuse their validation and concurrency approach.
- Current reduction UI accepts an updated count above the original and clamps the requested reduction to zero; reject this explicitly or use a separate count correction action. Decimal quantities currently truncate through parseInt.
- Required connection: store-scoped item/cost/count reads, real filters, reason-required count changes, stale quantity checks, server-side approvals, atomic once-only inventory/movement records, and audit history. Keep existing layout.
- Clarify before implementing: roles allowed to submit/approve adjustments; whether admin changes apply immediately; handling of returnable goods (stock reduction versus pending vendor return); destination product mapping and acceptance for transfers. Stores have separate product IDs, so transfers cannot assume shared product IDs/SKUs.
- Unsupported rebates/margin-after-rebate must remain blank until connected. No automatic cross-store synchronization.
